import { getCurrentUser } from "./supabase.js";

document.addEventListener("DOMContentLoaded", async () => {
  // 1. Check Auth State implicitly for Dashboard Redirect
  try {
    const user = await getCurrentUser();
    if (user) {
      window.location.href = "dashboard.html";
    }
  } catch (err) {
    console.error("Supabase not set up or offline:", err);
  }

  // 2. Navbar Scroll Effect
  const navbar = document.querySelector(".navbar");
  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  });

  // 3. Smooth Scroll to How It Works
  const scrollBtn = document.querySelector(".scroll-to-how");
  if (scrollBtn) {
    scrollBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const target = document.getElementById("how-it-works");
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    });
  }

  // 4. Mobile Hamburger Menu Toggle
  const hamburger = document.querySelector(".hamburger");
  const navLinks = document.querySelector(".navbar-links");
  if (hamburger && navLinks) {
    hamburger.addEventListener("click", () => {
      navLinks.classList.toggle("active");
    });
  }

  // 5. Intersection Observer for Floating Cards Animation
  const floatingCards = document.querySelectorAll(".floating-card");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-up");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 },
  );

  floatingCards.forEach((card, index) => {
    card.style.animationDelay = `${index * 0.15}s`;
    observer.observe(card);
  });
});
