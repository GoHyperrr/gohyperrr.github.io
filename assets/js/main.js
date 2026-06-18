// GoHyperrr Website Interactions
document.addEventListener("DOMContentLoaded", () => {
    console.log("⌘ GoHyperrr website initialized successfully.");

    // Highlight active link in navigation
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll(".nav-link");
    
    navLinks.forEach(link => {
        const linkPath = link.getAttribute("href");
        if (currentPath === linkPath || (linkPath !== "/" && currentPath.startsWith(linkPath))) {
            link.classList.add("active");
            link.style.color = "var(--text-primary)";
            link.style.borderBottom = "2px solid var(--accent-indigo)";
            link.style.paddingBottom = "4px";
        }
    });
});
