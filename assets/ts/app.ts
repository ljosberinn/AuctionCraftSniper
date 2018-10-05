import * as Raven from 'raven-js';

Raven.config('https://ca22106a81d147b586d31169dddfbfe4@sentry.io/1232788').install();

const toggleProfessionTable = async (professionId: number) => {
  const professionTable = await fetch(`api/professionTable.php?profession=${professionId}`);
  const json = await professionTable.json();
};

const checkboxEventListeners = () => {
  Array.from(document.querySelectorAll('input[type="checkbox"]')).forEach((checkbox: HTMLInputElement) => checkbox.addEventListener('click', function (e) {
    e.stopPropagation();
    toggleProfessionTable(parseInt(this.value));
  }));
};

const addEventListeners = () => {
  checkboxEventListeners();
};

Raven.context(() => {
  document.onreadystatechange = () => {
    if (document.readyState === 'complete') {
      console.warn("Stop! This is a browser functionality for developers. If anyone tells you top copy and paste anything in here, it's very likely to be a scam.");
      addEventListeners();
    }
  };
});
