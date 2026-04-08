# SkillNest — Complete Supabase Database Schema

> **PostgreSQL / Supabase compatible.** All tables reference `auth.users(id)` via Supabase Auth.
> Enable **Row Level Security (RLS)** on every table before going to production.

---

## Entity Map

| # | Table | Purpose |
|---|-------|---------|
| 1 | `profiles` | Extended user data linked to Supabase Auth |
| 2 | `skills` | Global catalog of all available skill names |
| 3 | `user_skills_teach` | Skills a user can teach (with proficiency & stats) |
| 4 | `user_skills_learn` | Skills a user wants to learn |
| 5 | `availability` | User weekly schedule grid (day × time slot) |
| 6 | `sessions` | Full session lifecycle (pending → completed/cancelled) |
| 7 | `session_escrow` | Credits held in escrow per session |
| 8 | `ratings` | Star ratings & written reviews per session |
| 9 | `credit_ledger` | Immutable credit transaction log |
| 10 | `conversations` | Direct-message thread between two users |
| 11 | `messages` | Individual messages within a conversation |
| 12 | `endorsements` | Skill endorsements between users |
| 13 | `notifications` | In-app notification feed |

---

## 1. `profiles`

**Purpose:** Extends Supabase `auth.users` with all SkillNest-specific data. Created automatically on signup via trigger. This is the central user table.

```sql
CREATE TABLE public.profiles (
  id                   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name            TEXT NOT NULL DEFAULT '',
  email                TEXT UNIQUE NOT NULL,
  college              TEXT,
  department           TEXT,
  year_of_study        SMALLINT CHECK (year_of_study BETWEEN 1 AND 6),
  mobile               TEXT,
  bio                  TEXT CHECK (length(bio) <= 300),
  avatar_url           TEXT,
  profile_completion   SMALLINT NOT NULL DEFAULT 0 CHECK (profile_completion BETWEEN 0 AND 100),
  credit_balance       INTEGER NOT NULL DEFAULT 4000 CHECK (credit_balance >= 0),
  avg_rating           NUMERIC(3,2) NOT NULL DEFAULT 0.00 CHECK (avg_rating BETWEEN 0 AND 5),
  total_sessions       INTEGER NOT NULL DEFAULT 0,
  sessions_taught      INTEGER NOT NULL DEFAULT 0,
  sessions_learned     INTEGER NOT NULL DEFAULT 0,
  login_streak         SMALLINT NOT NULL DEFAULT 0,
  last_seen_at         TIMESTAMPTZ,
  is_online            BOOLEAN NOT NULL DEFAULT FALSE,
  is_verified          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Columns explained:**

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK — mirrors `auth.users.id` |
| `full_name` | TEXT | Display name |
| `email` | TEXT | UNIQUE, synced from auth |
| `college` | TEXT | University / college name |
| `department` | TEXT | B.Tech IT, MBA, etc. |
| `year_of_study` | SMALLINT | 1–6, checked constraint |
| `mobile` | TEXT | Optional, for Settings tab |
| `bio` | TEXT | Max 300 chars |
| `avatar_url` | TEXT | Supabase Storage URL |
| `profile_completion` | SMALLINT | Re-calculated server-side (0–100) |
| `credit_balance` | INTEGER | Denormalized for fast reads — must match ledger |
| `avg_rating` | NUMERIC(3,2) | Recalculated by trigger on new rating |
| `total_sessions` | INTEGER | Taught + learned sessions |
| `login_streak` | SMALLINT | Updated daily by cron/edge function |
| `is_online` | BOOLEAN | Set by Socket presence events |

---

## 2. `skills`

**Purpose:** A normalized catalog of all skill names. Prevents duplicates and enables consistent skill-based matching across the platform.

```sql
CREATE TABLE public.skills (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE,
  category   TEXT NOT NULL CHECK (category IN (
               'tech', 'design', 'languages', 'music',
               'academic', 'business', 'other'
             )),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_skills_category   ON public.skills(category);
CREATE INDEX idx_skills_name_lower ON public.skills(lower(name));
```

**Sample seed data:**

| name | category |
|------|----------|
| Python | tech |
| UI/UX Design | design |
| French | languages |
| Guitar | music |
| Calculus | academic |
| Public Speaking | business |
| Machine Learning | tech |

---

## 3. `user_skills_teach`

**Purpose:** Each row means "user X can teach skill Y at proficiency Z". Stores aggregate stats (sessions, average rating, endorsements) for match scoring.

```sql
CREATE TABLE public.user_skills_teach (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id          UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  proficiency       TEXT NOT NULL DEFAULT 'Beginner'
                    CHECK (proficiency IN ('Beginner', 'Intermediate', 'Advanced')),
  sessions_count    INTEGER NOT NULL DEFAULT 0,
  avg_rating        NUMERIC(3,2) DEFAULT 0.00,
  endorsement_count INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, skill_id)
);

CREATE INDEX idx_ust_user  ON public.user_skills_teach(user_id);
CREATE INDEX idx_ust_skill ON public.user_skills_teach(skill_id);
```

---

## 4. `user_skills_learn`

**Purpose:** Skills a user wants to learn. The `is_active` flag maps to the "Actively looking" toggle visible on the Browse page.

```sql
CREATE TABLE public.user_skills_learn (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id   UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,   -- "Actively looking" toggle
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, skill_id)
);

CREATE INDEX idx_usl_user  ON public.user_skills_learn(user_id);
CREATE INDEX idx_usl_skill ON public.user_skills_learn(skill_id);
```

---

## 5. `availability`

**Purpose:** User's weekly schedule grid (7 days × 4 slots). Drives the scheduling modal's suggested times and match ranking.

```sql
CREATE TABLE public.availability (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day_of_week  SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun … 6=Sat
  slot         TEXT NOT NULL CHECK (slot IN ('morning', 'afternoon', 'evening', 'night')),
  is_available BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, day_of_week, slot)
);

CREATE INDEX idx_avail_user ON public.availability(user_id);
```

---

## 6. `sessions`

**Purpose:** The core session record. One row per session request. Covers the full lifecycle from pending to completion or cancellation.

```sql
-- ENUMs
CREATE TYPE session_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');

CREATE TABLE public.sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  learner_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  skill_id        UUID NOT NULL REFERENCES public.skills(id)   ON DELETE RESTRICT,
  status          session_status NOT NULL DEFAULT 'pending',
  duration_mins   SMALLINT NOT NULL CHECK (duration_mins IN (30, 60, 90, 120)),
  scheduled_at    TIMESTAMPTZ NOT NULL,
  completed_at    TIMESTAMPTZ,
  cancelled_at    TIMESTAMPTZ,
  cancelled_by    UUID REFERENCES public.profiles(id),
  cancel_reason   TEXT,
  meet_link       TEXT,
  notes           TEXT CHECK (length(notes) <= 200),
  credits_cost    INTEGER NOT NULL,     -- deducted from learner (1250 × hrs)
  credits_earned  INTEGER NOT NULL,     -- awarded to teacher  (2000 × hrs)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (teacher_id <> learner_id)
);

CREATE INDEX idx_sessions_teacher ON public.sessions(teacher_id);
CREATE INDEX idx_sessions_learner ON public.sessions(learner_id);
CREATE INDEX idx_sessions_status  ON public.sessions(status);
CREATE INDEX idx_sessions_sched   ON public.sessions(scheduled_at DESC);
```

**Status flow:**
```
pending ──► confirmed ──► completed
    │              └──────► cancelled
    └───────────────────► cancelled
```

---

## 7. `session_escrow`

**Purpose:** Tracks credits held from the learner between session request and resolution. Guarantees refunds on teacher cancellation and payouts on completion.

```sql
CREATE TYPE escrow_status AS ENUM ('held', 'released', 'refunded');

CREATE TABLE public.session_escrow (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL UNIQUE REFERENCES public.sessions(id) ON DELETE CASCADE,
  learner_id  UUID NOT NULL REFERENCES public.profiles(id),
  teacher_id  UUID NOT NULL REFERENCES public.profiles(id),
  amount      INTEGER NOT NULL CHECK (amount > 0),
  status      escrow_status NOT NULL DEFAULT 'held',
  resolved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 8. `ratings`

**Purpose:** Star ratings and written reviews. One rating per session per rater direction (learner → teacher). A 5-star rating also triggers a +500 credit bonus for the teacher via trigger.

```sql
CREATE TABLE public.ratings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  rater_id    UUID NOT NULL REFERENCES public.profiles(id),
  ratee_id    UUID NOT NULL REFERENCES public.profiles(id),
  stars       SMALLINT NOT NULL CHECK (stars BETWEEN 1 AND 5),
  review_text TEXT CHECK (length(review_text) <= 300),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, rater_id),      -- one rating per rater per session
  CHECK (rater_id <> ratee_id)
);

CREATE INDEX idx_ratings_ratee   ON public.ratings(ratee_id);
CREATE INDEX idx_ratings_session ON public.ratings(session_id);
```

---

## 9. `credit_ledger`

**Purpose:** Immutable, append-only log of every credit event. The **single source of truth** for credit history. `balance_after` is a denormalized running total for fast transaction list rendering.

```sql
CREATE TYPE credit_event AS ENUM (
  'signup_bonus',
  'profile_completion',
  'session_teach',
  'escrow_hold',
  'escrow_release',
  'escrow_refund',
  'five_star_rating',
  'login_streak',
  'endorsement_given',
  'referral_bonus',
  'milestone_bonus',
  'admin_adjustment'
);

CREATE TABLE public.credit_ledger (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type      credit_event NOT NULL,
  amount          INTEGER NOT NULL,           -- positive = earn, negative = spend
  balance_after   INTEGER NOT NULL,
  session_id      UUID REFERENCES public.sessions(id),
  related_user_id UUID REFERENCES public.profiles(id),  -- who endorsed / rated / referred
  description     TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ledger_user    ON public.credit_ledger(user_id, created_at DESC);
CREATE INDEX idx_ledger_session ON public.credit_ledger(session_id);
CREATE INDEX idx_ledger_event   ON public.credit_ledger(event_type);
```

> **Rule:** Never `UPDATE` or `DELETE` rows in `credit_ledger`. All corrections are new rows with event_type `admin_adjustment`.

---

## 10. `conversations`

**Purpose:** Direct message thread between exactly two users. `pair_hash` (a generated column) prevents duplicate threads between the same two users regardless of who initiates.

```sql
CREATE TABLE public.conversations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_b       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pair_hash    TEXT UNIQUE NOT NULL GENERATED ALWAYS AS (
                 CASE WHEN user_a < user_b
                   THEN user_a::text || '-' || user_b::text
                   ELSE user_b::text || '-' || user_a::text
                 END
               ) STORED,
  last_message TEXT,
  last_msg_at  TIMESTAMPTZ,
  unread_a     INTEGER NOT NULL DEFAULT 0,
  unread_b     INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (user_a <> user_b)
);

CREATE INDEX idx_conv_user_a ON public.conversations(user_a);
CREATE INDEX idx_conv_user_b ON public.conversations(user_b);
CREATE INDEX idx_conv_last   ON public.conversations(last_msg_at DESC NULLS LAST);
```

---

## 11. `messages`

**Purpose:** Individual messages within a conversation. Supports plain text, Google Meet link sharing, and session invitation cards (as rendered in `chat.html`).

```sql
CREATE TYPE message_type AS ENUM ('text', 'meet_link', 'session_invite');

CREATE TABLE public.messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type            message_type NOT NULL DEFAULT 'text',
  content         TEXT NOT NULL CHECK (length(content) BETWEEN 1 AND 500),
  session_id      UUID REFERENCES public.sessions(id),  -- for session_invite type
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_conv   ON public.messages(conversation_id, created_at ASC);
CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_messages_unread ON public.messages(conversation_id) WHERE NOT is_read;
```

---

## 12. `endorsements`

**Purpose:** One user vouches for another's specific skill. Each endorser–endorsee–skill triple is unique (can't double-endorse). Giving an endorsement earns +250 credits.

```sql
CREATE TABLE public.endorsements (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endorser_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endorsee_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id     UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (endorser_id, endorsee_id, skill_id),
  CHECK (endorser_id <> endorsee_id)
);

CREATE INDEX idx_endorse_endorsee ON public.endorsements(endorsee_id, skill_id);
CREATE INDEX idx_endorse_endorser ON public.endorsements(endorser_id);
```

---

## 13. `notifications`

**Purpose:** In-app notification feed used by the bell icon in every page's topbar. Covers all platform events a user would want to be alerted about.

```sql
CREATE TYPE notif_type AS ENUM (
  'session_request',
  'session_confirmed',
  'session_cancelled',
  'session_completed',
  'message_received',
  'rating_received',
  'credit_earned',
  'credit_spent',
  'endorsement_received',
  'new_match',
  'streak_milestone'
);

CREATE TABLE public.notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type       notif_type NOT NULL,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  link_url   TEXT,
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  actor_id   UUID REFERENCES public.profiles(id),    -- who triggered it
  session_id UUID REFERENCES public.sessions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notif_user   ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notif_unread ON public.notifications(user_id) WHERE NOT is_read;
```

---

## Automation: Triggers & Functions

### Trigger 1 — Auto-create profile + signup bonus on register

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Create profile row
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  -- Credit the signup bonus
  INSERT INTO credit_ledger (user_id, event_type, amount, balance_after, description)
  VALUES (NEW.id, 'signup_bonus', 4000, 4000, 'Welcome to SkillNest! Signup bonus credited.');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Trigger 2 — Auto-update `updated_at`

```sql
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER trg_sessions_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
```

### Trigger 3 — Recalculate avg_rating on profiles after new rating

```sql
CREATE OR REPLACE FUNCTION public.recalc_avg_rating()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE profiles
  SET avg_rating = (
    SELECT ROUND(AVG(stars)::numeric, 2)
    FROM ratings WHERE ratee_id = NEW.ratee_id
  )
  WHERE id = NEW.ratee_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_recalc_rating
  AFTER INSERT ON public.ratings
  FOR EACH ROW EXECUTE FUNCTION public.recalc_avg_rating();
```

### Trigger 4 — Award +500 credits on 5-star rating

```sql
CREATE OR REPLACE FUNCTION public.award_five_star_bonus()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.stars = 5 THEN
    UPDATE profiles SET credit_balance = credit_balance + 500 WHERE id = NEW.ratee_id;
    INSERT INTO credit_ledger (user_id, event_type, amount, balance_after, session_id, related_user_id, description)
    SELECT NEW.ratee_id, 'five_star_rating', 500,
           (SELECT credit_balance FROM profiles WHERE id = NEW.ratee_id),
           NEW.session_id, NEW.rater_id,
           '5-star rating received';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_five_star_bonus
  AFTER INSERT ON public.ratings
  FOR EACH ROW EXECUTE FUNCTION public.award_five_star_bonus();
```

### Trigger 5 — Increment endorsement_count on user_skills_teach

```sql
CREATE OR REPLACE FUNCTION public.increment_endorsement_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE user_skills_teach
  SET endorsement_count = endorsement_count + 1
  WHERE user_id = NEW.endorsee_id AND skill_id = NEW.skill_id;

  -- Award endorser +250 credits
  UPDATE profiles SET credit_balance = credit_balance + 250 WHERE id = NEW.endorser_id;
  INSERT INTO credit_ledger (user_id, event_type, amount, balance_after, related_user_id, description)
  SELECT NEW.endorser_id, 'endorsement_given', 250,
         (SELECT credit_balance FROM profiles WHERE id = NEW.endorser_id),
         NEW.endorsee_id, 'Endorsed a peer skill';
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_endorsement_count
  AFTER INSERT ON public.endorsements
  FOR EACH ROW EXECUTE FUNCTION public.increment_endorsement_count();
```

---

## Row-Level Security Policy Summary

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `profiles` | ✅ Anyone | 🔒 Own via trigger | 🔒 Own row | ❌ Deny |
| `skills` | ✅ Anyone | ❌ Admin only | ❌ Admin only | ❌ Admin only |
| `user_skills_teach` | ✅ Anyone | 🔒 Own rows | 🔒 Own rows | 🔒 Own rows |
| `user_skills_learn` | 🔒 Own only | 🔒 Own rows | 🔒 Own rows | 🔒 Own rows |
| `availability` | 🔒 Own only | 🔒 Own rows | 🔒 Own rows | 🔒 Own rows |
| `sessions` | 🔒 Participant | 🔒 Learner creates | 🔒 Participant | ❌ Deny |
| `session_escrow` | 🔒 Participant | 🔒 Service role | 🔒 Service role | ❌ Deny |
| `ratings` | ✅ Anyone | 🔒 After session | ❌ Deny | ❌ Deny |
| `credit_ledger` | 🔒 Own only | 🔒 Service role | ❌ Deny | ❌ Deny |
| `conversations` | 🔒 Participant | 🔒 Both parties | 🔒 Participant | ❌ Deny |
| `messages` | 🔒 Participant | 🔒 Sender | ❌ Deny | ❌ Deny |
| `endorsements` | ✅ Anyone | 🔒 Not self | ❌ Deny | 🔒 Own rows |
| `notifications` | 🔒 Own only | 🔒 Service role | 🔒 Own (read) | 🔒 Own rows |

---

## Credit Economy Reference

| Trigger | Amount |
|---------|--------|
| Signup welcome bonus | **+4000** |
| Profile fully completed | **+1250** |
| Teach a session (1 hr) | **+2000** |
| Receive 5-star rating | **+500** |
| 7-day login streak | **+750** |
| Endorse another user's skill | **+250** |
| Referral (friend completes session) | **+2500** |
| Request a session to learn (1 hr) | **−1250** |

---

## Relationship Diagram

```
auth.users (1) ────────────── (1) profiles
                                     │
               ┌─────────────────────┼──────────────────────┐
               │                     │                      │
        (N) user_skills_teach  (N) user_skills_learn  (N) availability
               │                     │
               └────────┬────────────┘
                        │
                   (N) skills ◄── foreign key anchor

profiles ─── (N) sessions (as teacher_id)
profiles ─── (N) sessions (as learner_id)
             sessions (1) ───── (1) session_escrow
             sessions (1) ───── (N) ratings
             sessions (1) ───── (N) credit_ledger rows
             sessions (1) ───── (N) messages (via session_invite type)

profiles ─── (N) credit_ledger
profiles ─── (N) notifications
profiles ─── (N) endorsements (as endorser)
profiles ─── (N) endorsements (as endorsee)
profiles ─── (N) conversations (as user_a or user_b)
conversations (1) ───── (N) messages
```
