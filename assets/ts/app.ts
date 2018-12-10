import { init } from '@sentry/browser';
import { getACSLocalStorage } from './localStorage';
import { addEventListeners } from './eventChain';

init({
  dsn: 'https://a14f918eaf6544eea696ad35340f68a5@sentry.io/1329859',
});

document.onreadystatechange = () => {
  if (document.readyState === 'complete') {
    console.warn("Stop! This is a browser functionality for developers. If anyone tells you top copy and paste anything in here, it's very likely to be a scam.");
    addEventListeners();
    getACSLocalStorage();
  }
};
