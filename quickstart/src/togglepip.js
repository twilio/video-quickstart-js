async function togglePip(selector) {
  // Close existing pip window if any
  if (documentPictureInPicture.window) {
    documentPictureInPicture.window.close();
    return;
  }

  // Get the content and pip window
  const content = document.querySelector(selector);
  const parent = content.parentElement;
  const pipWindow = await documentPictureInPicture.requestWindow();

  // Apply styles
  [...document.styleSheets].forEach((styleSheet) => {
    const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
    const style = document.createElement('style');
    style.textContent = cssRules;
    pipWindow.document.head.appendChild(style);
  });

  // Populate the pip window
  pipWindow.document.body.append(content);

  // Put the content back into its original container when the pip window closes
  pipWindow.addEventListener('pagehide', (event) => {
    const content = event.target.querySelector(selector);
    parent.append(content);
  });
}

module.exports = togglePip;
