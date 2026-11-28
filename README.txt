Satta7 iPhone Home Screen icon fix

Files:
* index.html — adds the Apple touch icon link using a relative path.
* sw.js — adds apple-touch-icon.png to the service-worker precache list.
* apple-touch-icon.png — opaque 180x180 PNG derived from the supplied icon-512.png.

Deploy these three files together in the same directory as the existing Satta7 web-host files. The edit does not include icons.json because it was not supplied; verify the host's published file list/path when available. satta7.js is unchanged.
