// Setup ================================================================
// Load info for langauge model
info = lingthing.corpus_info(counts)

// Global vars for the typing search doohickey
const beam_width = 30; // width of beam search
var candidates = [""];    // running list of candidates.
var active = false;

var key_pairs = {
    "q":"p","w":"o","e":"i","r":"u","t":"y",
    "a":";","s":"l","d":"k","f":"j","g":"h",
    "z":".","x":",","c":"m","v":"n",
    "Q":"P","W":"O","E":"I","R":"U","T":"Y",
    "A":":","S":"L","D":"K","F":"J","G":"H",
    "Z":">","X":"<","C":"M","V":"N"
} // Might make some changes, e.g. maybe map 't' to both 'u' and 'y', or
  // even just to u.
  // Also, I seem to get n and m (c and v) mixed up a lot, for some reason.

// Main algorithm stuff ===============================================
function log_prob(sentence){
    // Just a shorter wrapper for lingthing.log_prob
    return lingthing.log_prob(sentence,counts,"laplace",info.n,info.d,info.N);
}

function possibilities(prefix,new_char){
    // Return all possibilities obtained by affixing one of the
    //  variations of new_char to the string prefix.
    if (!key_pairs[new_char]){
        return [prefix + new_char];
    }else{
        return [prefix + new_char, prefix + key_pairs[new_char]];
    }
}

function next_letter(new_char){
    // Consider adding a new letter (with possibly multiple interpretations)
    //  to each of the candidate text values, and return only the most
    //  likely options according to the loaded language model.

    // Beam search to find most likely texts:
    candidates = candidates
        .reduce((a,b) => a.concat(possibilities(b,new_char)),[])
        .map(c => [c,log_prob(c)])
        .sort((a,b) => b[1] - a[1])
        .map(c => c[0])
        .slice(0,beam_width);
    // Update textbox
    document.getElementById("main_box").value=candidates[0];
}

function backspace(){
    candidates = candidates
        .map(c => c.length > 0? c.slice(0,c.length-1) : "");
    candidates = [...new Set(candidates)] // Remove duplicates
        .map(c => [c,log_prob(c)])
        .sort((a,b) => b[1] - a[1])
        .map(c => c[0])
        .slice(0,beam_width);
    if(candidates.length == 0){
        candidates = [""]; // Make sure list is never empty
    }
    // Update textbox
    document.getElementById("main_box").value=candidates[0];
}

// Input handling details ==================================================

function handle_input(){
    // Just a little rejigger to make sure the value of the texbox matches
    //  best candidate.
    if (active){
        // Only mess with box if capslock is on...
        document.getElementById("main_box").value=candidates[0];
    }
}

function undo_caps(c){
    if (c.toUpperCase() == c.toLowerCase()){
        return c;
    }
    return c.toUpperCase() == c ? c.toLowerCase() : c.toUpperCase();
}

function handle_key(e){
    if (!e.getModifierState("CapsLock")){
        // Leave everything as normal.
        active = false;
        return;
    } else if (!active){
        // We are just now switching from no-capslock to capslock.
        // Trust everything that the user typed while in normal mode.
        candidates = [document.getElementById("main_box").value];
        active = true;
    }
    key = e.key
    if (key == "Backspace"){
        backspace();
    }else if (key == "Enter"){
        next_letter("\n");
    }else if (key == "`"){
        backspace();
    }else if (key == " "){
        if (e.shiftKey){
            next_letter("\n"); // shift-space for newline
        }else{
            next_letter(" ");
        }
    }else if (key == "Tab"){
        // Should do nothing (Don't want to disrupt tab navigation behaviour)
    }else if (["ArrowLeft","ArrowUp","ArrowRight","ArrowDown"].includes(key)){
        // Should also do nothing
    }else{
        next_letter(undo_caps(key));
    }
    // TODO: Ignore arrow keys
}

function clear_box(){
    document.getElementById("main_box").value = "";
}
