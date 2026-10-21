
var GA_MEASUREMENT_ID = 'G-TJ91V58VD0';
(function () {
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { dataLayer.push(arguments); };
  gtag('js', new Date());
  var uid = null;
  try { uid = localStorage.getItem('user_id'); } catch (e) {}
  // user_id lets GA4 recognise the same person across visits and devices (retention)
  gtag('config', GA_MEASUREMENT_ID, uid ? { user_id: uid } : {});
})();
