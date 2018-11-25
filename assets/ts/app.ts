// import { init } from '@sentry/browser';
import { getACSLocalStorage } from './localStorage';
import { addEventListeners } from './eventChain';

/* init({
  dsn: 'https://a14f918eaf6544eea696ad35340f68a5@sentry.io/1329859',
  debug: true,
}); */

const convertLastUpdateToRelTimeStr = (lastUpdate: number) => {
  const SECONDS_IN_DAY = 86400;
  const SECONDS_IN_HOUR = 3600;

  if (lastUpdate > SECONDS_IN_DAY) {
    const d = Math.floor(lastUpdate / SECONDS_IN_DAY);
    const h = Math.floor(Math.floor(lastUpdate - d * SECONDS_IN_DAY) / SECONDS_IN_HOUR);
    const m = Math.floor(Math.floor(lastUpdate - d * SECONDS_IN_DAY - h * SECONDS_IN_HOUR) / 60);
    const s = Math.floor(lastUpdate - d * SECONDS_IN_DAY - h * SECONDS_IN_HOUR - m * 60);

    return `${d}d ${h}h ${m}m ${s}s ago`;
  }

  if (lastUpdate > SECONDS_IN_HOUR) {
    const h = Math.floor(lastUpdate / SECONDS_IN_HOUR);
    const m = Math.floor(Math.floor(lastUpdate - h * SECONDS_IN_HOUR) / 60);
    const s = Math.floor(lastUpdate - h * SECONDS_IN_HOUR - m * 60);

    return `${h}h ${m}m ${s}s ago`;
  }

  if (lastUpdate > 60) {
    const m = Math.floor(lastUpdate / 60);
    const s = lastUpdate - m * 60;

    return `${m}m ${s}s ago`;
  }

  return `${lastUpdate}s ago`;
};

document.onreadystatechange = () => {
  if (document.readyState === 'complete') {
    console.warn("Stop! This is a browser functionality for developers. If anyone tells you top copy and paste anything in here, it's very likely to be a scam.");
    addEventListeners();
    getACSLocalStorage();
  }
};
