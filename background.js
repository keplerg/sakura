chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: scrollAndCopyMainPage
  });
});

// Utilities
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/* Doesn't work
function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
*/

async function scrollAndCopyMainPage() {
  const scrollDelay = 2000; // ms between scrolls
  const maxScrollAttempts = 100; // to prevent infinite loop
  const main = document.querySelector('main');

  if (!main) {
    alert('No main element found.');
    return;
  }

  let lastHeight = main.children[0].scrollHeight;
  let attempts = 0;

  while (attempts < maxScrollAttempts) {
    main.children[0].children[0].scrollIntoView({
      behavior: "smooth",
      block: "start",
      inline: "start"
    });
    // console.log('scrolling...');
    await new Promise(resolve => setTimeout(resolve, scrollDelay));
    // console.log('scrolling done');

    const newHeight = main.children[0].scrollHeight;
    if (newHeight === lastHeight) {
      break; // No more content being loaded
    }
    lastHeight = newHeight;
    attempts++;
  }

  // Clone main and inline images
  const clone = main.cloneNode(true);

  clone.focus();

  /* Doesn't work
  const imgElements = clone.querySelectorAll('img');
  for (let img of imgElements) {
    try {
      const response = await fetch(img.src, { mode: 'cors' });
      const blob = await response.blob();
      const base64 = await blobToDataURL(blob);
      img.src = base64;
    } catch (err) {
      console.warn(`Failed to inline image ${img.src}:`, err);
    }
  }
  */

  const finalHTML = clone.outerHTML;

  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([finalHTML], { type: 'text/html' }),
        'text/plain': new Blob([clone.innerText], { type: 'text/plain' })
      })
    ]);
    alert('main page HTML copied after full scroll!');
  } catch (err) {
    console.error('Clipboard write failed:', err);
    alert('Failed to copy HTML to clipboard.');
  }
}
