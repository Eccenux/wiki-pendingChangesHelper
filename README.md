# Wiki Pending Changes Helper

Pomocnik przeglądania artykułów Wikipedii. Otwiera pierwsze 5 stron do przejrzenia i potem kolejne 5. Na stronie z wkładem użytkownika(-czki) stara się otworzyć unikatowe strony.

Działa na stronach:
1. Wkład (Special:Contributions) – tutaj otwierane są nieprzejrzane strony. Skrypt magicznie pomija duplikaty jeśli dany użytkownik zrobił więcej niż jedną edycję. Ustala również szybko wszystkie edycje, które są do przejrzenia.
2. Strony ze zmianami oczekującymi na przejrzenie (Special:PendingChanges) – tutaj daje możliwość otworzenia pierwszych 5 linków. Ale również pierwszych 5 nieobserwowanych przez nikogo.
3. Obserwowane (Special:Watchlist) – tu również otwieranych jest 5 pierwszych nieprzejrzanych. Ale tutaj zaczyna się od najnowszych zmian.
4. Nowe strony (Special:Newpages).

Gadżet i pl.wiki:

* https://pl.wikipedia.org/wiki/Wikipedia:Narz%C4%99dzia/Pending_Changes_Helper -- opis na pl.wiki.
* https://pl.wikipedia.org/wiki/MediaWiki:Gadget-oldreviewedpages.js -- kod gadżetu.

Instalacja
----------

1. Zainstaluj [TamperMonkey](https://addons.mozilla.org/pl/firefox/addon/tampermonkey/) (jeśli jeszcze nie masz).
2. Jak już masz TM &rarr; **[zainstaluj skrypt](https://github.com/Eccenux/wiki-pendingChangesHelper/raw/master/pendingChangesHelper.user.js)**.

Skrypt jest testowany głównie w Firefox, ale powinien działać również Chrome, Microsoft Edge, Safari, Opera Next. Zobacz więcej na witrynie: [www.tampermonkey.net](https://www.tampermonkey.net/). 

Licencja i autorzy
----------------------------

Fork (user-script): Maciej Nux Jaros.
Pierwotny skrypt: Beau; Matma Rex.

Licencja: [CC-BY-SA](https://creativecommons.org/licenses/by-sa/3.0/).
