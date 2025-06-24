export default function themeMode() {
  const $btnMode = document.getElementById("mode");
  const $checkBox = document.getElementById("darkmode-toggle");

  if (!$btnMode) {
    console.error(`El selector ${$btnMode} no existe.`);
    return;
  }

  if (!$checkBox) {
    console.error(`No existe elemento con id "darkmode-toggle".`);
    return;
  }

  const $html = document.documentElement;
  const stored = localStorage.getItem("theme");
  let savedTheme;

  if (stored === "light" || stored === "dark") {
    savedTheme = stored;
  } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    savedTheme = "dark";
  } else {
    savedTheme = "light";
  }

  $html.setAttribute("theme", savedTheme);
  $checkBox.checked = (savedTheme === "dark");

  $btnMode.addEventListener("click", () => {
    const currentTheme = $html.getAttribute("theme");
    savedTheme = currentTheme === "dark" ? "light" : "dark";

    $html.setAttribute("theme", savedTheme);
    localStorage.setItem("theme", savedTheme);
    $checkBox.checked = (savedTheme === "light");
  });
}
