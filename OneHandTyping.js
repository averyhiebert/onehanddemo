/* A self-contained library for adding left-handed typing to any
textbox on the page.  This should add only a single class, OneHandTyper, to
the global namespace. 

A OneHandTyper object should be able to be added to a textbox on the page,
and should encapsulate

Has lingthing as a dependency (assumes that it is imported as 'lingthing').*/

class OneHandTyping {
    constructor(corpus_counts, mapping, elem, beam_width){
        this.elem = elem; // The element (text input or text area)
        // TODO: Perform sanity checks (e.g. is the element actually a textbox,
        //   and more likely, does it have conflicting handlers already).
        // If no problems, continue.

        // Initialize model
        this.model = corpus_counts; // n-gram counts
        var model_info = lingthing.corpus_info(corpus_counts);
        this.n = model_info.n
        this.d = model_info.d
        this.N = model_info.N

        // Typing algorithm settings/variables:
        this.mapping = mapping; // Keyboard mapping
        this.beam_width = beam_width || 30; // Param for beam search
        this.active = false;    // Whether we are in one-hand mode
        this.candidates = [""]; // Current candidate sentences

        // Add handlers to textbox
        //  (Sorry for the nasty, but necessary, that=this hack)
        var that = this;
        this.elem.oninput = function(){
            that.handleInput();
        }
        this.elem.onkeypress = function(e){
            that.handleKey(e);
        }
    }

    handleInput(){
        // Just a little rejigger to make sure the value of the
        //  textbox matches best candidate.
        if (this.active){
            this.elem.value=this.candidates[0];
        }
    }

    handleKey(e){
        if (!e.getModifierState("CapsLock")){
            // Leave everything as normal.
            this.active = false;
            return;
        } else if (!this.active){
            // We are just now switching from no-capslock to capslock.
            // Trust everything that the user typed while in normal mode.
            this.candidates = [this.elem.value];
            this.active = true;
        }
        var key = e.key;
        if (key == "Backspace"){
            this.backspace();
        }else if (key == "Enter"){
            this.nextLetter("\n");
        }else if (key == "`"){
            this.backspace();
        }else if (key == " "){
            if (e.shiftKey){
                this.nextLetter("\n"); // shift-space for newline
            }else{
                this.nextLetter(" ");
            }
        }else if (key.length > 1){
            // Do nothing (This catches Tab, arrow keys, escape, etc...)
        }else{
            // Should be a normal letter.
            this.nextLetter(this.undoCaps(key));
        }
    }

    logProb(sentence){
        // Wrapper for lingthing.log_prob + corpus info
        return lingthing.log_prob(sentence,this.model,"laplace",
            this.n,this.d,this.N);
    }

    possibilities(prefix,new_char){
        // Return all possibilities obtained by affixing one of the
        //  variations of new_char to the string prefix.
        // TODO: Rewrite to allow one-to-many mappings
        if (! this.mapping[new_char]){
            return [prefix + new_char];
        }else{
            return [prefix + new_char, prefix + this.mapping[new_char]];
        }
    }

    nextLetter(new_char){
        // Consider adding possible new letters
        //  to each of the candidate text values, and return only the most
        //  likely options according to the loaded language model.
        // Beam search to find most likely texts:
        this.candidates = this.candidates
            .reduce((a,b) => a.concat(this.possibilities(b,new_char)),[])
            .map(c => [c,this.logProb(c)])
            .sort((a,b) => b[1] - a[1])
            .map(c => c[0])
            .slice(0,this.beam_width);
        // Update textbox
        this.elem.value = this.candidates[0];    
    }

    backspace(){
        this.candidates = this.candidates
            .map(c => c.length > 0? c.slice(0,c.length-1) : "");
        this.candidates = [...new Set(this.candidates)] // Remove duplicates
            .map(c => [c,this.logProb(c)])
            .sort((a,b) => b[1] - a[1])
            .map(c => c[0]);
        if(this.candidates.length == 0){
            this.candidates = [""]; // Make sure list is never empty
        }
        // Update textbox
        this.elem.value=this.candidates[0];
    }

    undoCaps(c){
        if (c.toUpperCase() == c.toLowerCase()){
            return c;
        }
        return c.toUpperCase() == c ? c.toLowerCase() : c.toUpperCase();
    }
}// OneHandTyping
