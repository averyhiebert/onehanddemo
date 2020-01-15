# One-Handed Typing in the Browser Demo

This is a demo/proof-of-concept/testbed for one-handed typing
(inspired by Randall Munroe's [Mirrorboard](https://blog.xkcd.com/2007/08/14/mirrorboard-a-one-handed-keyboard-layout-for-the-lazy/), 
although others have come up with the same idea independently).
My improvement is the use of a character-level language model 
(specifically, my library 
[⚡lingthing⚡](https://www.npmjs.com/package/lingthing)) to
remove the need to explicitly indicate when you're using "normal" vs "mirrored"
keys.  Simply hitting capslock puts you in mirror mode, and the language model
intelligently guesses what you're trying to type.  Occasional errors can 
easily be corrected by leaving capslock mode.

Try it out [here](https://averyhiebert.github.io/onehanddemo/)! So far, 
it seems to work pretty well, although there are occasionally some
words that are unavoidably ambigous (e.g. giant/heavy, interest/entirely) and
I've only tried conventional English text (no programming, dialect etc.).

Note also that the current version is based on my own touch-typing muscle
memory, which apparently differs slightly from the more commonly-taught
finger layouts (although it's interesting to note that Randall Munroe's original
mirrorboard layout matches my own assumptions about key placement).
The developer of [One Hand Keyboard](http://www.onehandkeyboard.org/)
apparently also types this way, and encountered the same problem,
as described [here](http://www.onehandkeyboard.org/standard-qwerty-finger-placement/).  In light of this (and the fact that alternate
keyboard layouts are common and everyone has different ingrained preferences),
supporting alternate layouts is a high priority on my list of planned 
improvements.


## Roadmap:
Currently, this is just a single page proof-of-concept webapp.

When I have time, my plan is to:
 1. Convert this from a single webpage into a library that can be used to add
    this functionality to any text input, or multiple inputs on the same page.  
    This is probably not very useful on its own, but it leads to 2.
 2. Create a browser extension that enables this functionality for all text
    entry on the web.
 3. (Unlikely) Look into an OS-wide solution.

## Similar Products:
There exists a similar OS-wide product called 
[One Hand Keyboard](http://www.onehandkeyboard.org/), but it doesn't
address my needs because
 1. It's not open-source 
 2. It's not free (there is a free demo, but I haven't tried it due 
    to 3 so I don't know what the limitations are)
 3. It's only available for proprietary OSes (i.e. not Linux)
 4. It appears to use a dictionary-based approach, which I don't think can be 
    extended as easily to multiple input contexts, e.g. programming
 5. Being OS-wide has downsides & risks as well as advantages.

There are also many other scripts & hardware products which require the user
to explicitly specify which keystrokes are mirrored vs normal,
similar to Randall Munroe's original idea, but that's less convenient.
