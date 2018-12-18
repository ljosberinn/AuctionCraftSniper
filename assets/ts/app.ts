import { init } from '@sentry/browser';
import { getACSLocalStorage } from './localStorage';
import { addEventListeners } from './eventChain';

init({
  dsn: 'https://a14f918eaf6544eea696ad35340f68a5@sentry.io/1329859',
  release: 'AuctionCraftSniper@c14de071d23f8a6f7dcd327afbb487831555be68',
});

(() => {
  // https://developer.mozilla.org/en-US/docs/Web/API/NodeList/forEach#Polyfill
  if (!NodeList.prototype.forEach) {
    NodeList.prototype.forEach = function (callback, thisArg) {
      thisArg = thisArg || window;
      for (let i = 0; i < this.length; i++) {
        callback.call(thisArg, this[i], i, this);
      }
    };
  }

  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/entries#Polyfill
  if (!Object.entries) {
    Object.entries = function (obj) {
      const ownProps = Object.keys(obj);

      let i = ownProps.length;
      const resArray = new Array(i); // preallocate the Array
      while (i--) resArray[i] = [ownProps[i], obj[ownProps[i]]];

      return resArray;
    };
  }

  // eventual fetch integration in case it will be required
  if (!('fetch' in window)) {
    alert('Your browser is not supporting modern web standards. Please use a browser such as Chrome or Firefox to properly use this website.');
    console.error('fetch unsupported');
  }
})();

document.onreadystatechange = () => {
  if (document.readyState === 'complete') {
    console.warn("Stop! This is a browser functionality for developers. If anyone tells you top copy and paste anything in here, it's very likely to be a scam.");
    addEventListeners();
    getACSLocalStorage();
  }
};
