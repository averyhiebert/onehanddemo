(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.lingthing = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
function check_n(counts){
    /* Given an object representing corpus counts of various n-grams,
    check what the largest 'n' value included is. */
    return Object.keys(counts).reduce((a,b) => Math.max(a,b.length),0);
}

function check_d(counts){
    /* Given an object representing corpus counts of various n-grams,
    check how many distinct unigrams there are.*/
    return Object.keys(counts).filter(x => x.length == 1).length;
}

function corpus_size(counts){
    /* Check total number of characters in corpus. */
    return Object.keys(counts).filter(x => x.length == 1)
        .reduce((a,b) => a + counts[b],0);
}

function corpus_info(counts){
    /* Get the n, d, and N values (described elsewhere, in e.g. log_prob) 
    for a corpus. */
    return {
        n: check_n(counts),
        d: check_d(counts),
        N: corpus_size(counts)
    };
}

function ngram_laplace_prob(ngram, counts, d, N){
    /* Given an ngram, an object containing ngram counts, a number d
    of distinct possible unigrams, and a number N of total observed
    unigrams (only used in the case where n = 1), return an estimated
    conditional probability of the last character of the ngram given
    the earlier characters of the ngram, with Laplace smoothing.*/
    n = ngram.length;
    numerator = counts[ngram] ? counts[ngram] + 1 : 1;
    subgram = ngram.slice(0,n-1)
    denominator = (n==1 ? N+d : (counts[subgram] ? counts[subgram]+d : d));
    return numerator/denominator;
}

function log_prob(sentence,counts,smoothing,n,d,N){
    /* Given a string of characters (sentence), estimate log probability based
    on the corpus ngram counts (counts), depending on the choice of
    smoothing.  
    
    The size (n) of n-grams can be specified to avoid some
    unnecessary computation, or to use a smaller value of n than the maximum
    supported by the passed ngram counts, but this parameter is optional.

    Similarly, a value d can be passed in to indicate the number of
    distinct characters in the corpus, and N for the total number of
    characters in the corpus, but these are also optional, to avoid
    some unnecessary computation.

    The values n, d, and N can be obtained using the function corpus_info.

    If smoothing == 'laplace', then Laplace (add 1) smoothing is used.
    This is currently the only smoothing option, but I plan
    to add linear interpolation between different n-gram lengths as well.*/
    smoothing = smoothing || 'laplace';
    if (smoothing !== 'laplace'){
        throw "Invalid smoothing type";
    }
    var n = n || check_n(counts);
    var N = N || corpus_size(counts); // Relevant for first char in string
    if (smoothing == 'laplace'){
        var d = d || check_d(counts);
    }

    total = 0;
    /* TODO: Replace loop with a nice tidy map & reduce. */
    for (i = 0; i < sentence.length; i++){
        var gram = sentence.slice(Math.max(0,i-n+1),i+1);
        if (smoothing == 'laplace'){
            total += Math.log(ngram_laplace_prob(gram,counts,d,N));
        }else{
            // Should currently never be reached, but just in case
            throw "Invalid smoothing type";
            // TODO: Eventually implement linear interpolation. 
        }
    }
    return total;
}


module.exports = {
    log_prob: log_prob,
    corpus_info: corpus_info
}

},{}]},{},[1])(1)
});
