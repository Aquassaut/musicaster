# musicaster

A node.js app that makes it easy to podcast music albums or multi-episode shows

## Why would you want to use it ?

This app is cool for very specific use cases.
For instance, you like short and multi-part podcasts, such as the
[History according to Bob podcast](http://www.summahistorica.com/).
In this case, by organizing your folders per episode, you'll be able to 
mash the full episodes together and download them as if they were never
released as different parts.

An other use-case is f you like your podcast player,
and want to occasionaly listen to your music with it.
This app will let you download an album as if it was a podcast episode.

## Configuration
This app looks for a config.json file with the following object:

* *port*: the port your application will listen to
* *folder*: the directory/ies you want the application to watch and serve
* *feed*: an object with the following keys
  * *title*: the title of the feed
  * *description*: a brief description of your feed
  * *feed_url*: the URL your feed will be accessible from
  * *site_url*: the URL your website will be accessible from. It can be the same as feed_url, but not necessarly.

To get started with this config file, you can run `cp config.json.example config.json; $EDITOR config.json` and start from there.

## Getting started
To start, simply run `npm install` to install the dependencies, and `npm start` to launch the daemon.

## License
This application is distributed under the [Cecill-B license](http://www.cecill.info/licences/Licence_CeCILL-B_V1-en.html).

TL;DR: MIT-style license, with more words, because in France, we love paperwork.

