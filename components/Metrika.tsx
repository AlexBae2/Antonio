import Script from 'next/script';
import { IS_GITHUB } from '@/lib/site';

/**
 * Счётчик Яндекс.Метрики (112122895, аккаунт nasmeny.antonio).
 * ID берём из NEXT_PUBLIC_METRIKA_ID: без переменной компонент молчит, поэтому
 * локальная разработка и превью-сборки не засоряют статистику прода. На стенде
 * GitHub Pages не подключаем - он закрыт от индексации и живёт на чужом домене.
 *
 * Цели вызываются из LeadForm, Quiz и Calculator через window.ym и заведены
 * в интерфейсе Метрики как целевые события с точным совпадением идентификатора.
 */
export default function Metrika() {
  const id = process.env.NEXT_PUBLIC_METRIKA_ID;
  if (!id || IS_GITHUB) return null;

  return (
    <>
      <Script id="metrika" strategy="afterInteractive">
        {`(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
m[i].l=1*new Date();
for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
ym(${id}, "init", {ssr:true, webvisor:true, clickmap:true, accurateTrackBounce:true, trackLinks:true});`}
      </Script>
      <noscript>
        <div>
          <img
            src={`https://mc.yandex.ru/watch/${id}`}
            style={{ position: 'absolute', left: '-9999px' }}
            alt=""
          />
        </div>
      </noscript>
    </>
  );
}
