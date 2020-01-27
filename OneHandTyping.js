/* A self-contained library for adding left-handed typing to any
textbox on the page.  This should add only a single class, OneHandTyping, to
the global namespace. 

A OneHandTyping object should be able to be added to a textbox on the page,
by passing in the element directly, or by specifying an id.

Has lingthing as a dependency (assumes that it is imported as 'lingthing').*/

class OneHandTyping {
    constructor(corpus_counts, mapping, elem, beam_width){
        if (typeof elem === 'string'){
            this.elem = document.getElementById(elem);
            if (!this.elem){
                throw "Element with id '" + elem + "' not found";
            }
        }else{
            this.elem = elem;
        }
        // TODO: Perform sanity checks (e.g. is the element actually a textbox,
        //   and more likely, does it have conflicting handlers already).
        // If no problems, continue.
        // If there are handlers, maybe try to keep them?

        // Initialize model
        this.model = corpus_counts; // n-gram counts
        var model_info = lingthing.corpus_info(corpus_counts);
        this.n = model_info.n
        this.d = model_info.d
        this.N = model_info.N

        // Typing algorithm settings/variables:
        var default_mappings = {
            "default":{
                "q":"p","w":"o","e":"i","r":"u","t":"y",
                    "y":"t","u":"r","i":"e","o":"w","p":"q",
                "a":";","s":"l","d":"k","f":"j","g":"h",
                    "h":"g","j":"f","k":"d","l":"s",";":"a",
                "z":".","x":",","c":"m","v":"n",
                    "n":"v","m":"c",",":"x",".":"z",
                "Q":"P","W":"O","E":"I","R":"U","T":"Y",
                    "Y":"T","U":"R","I":"E","O":"W","P":"Q",
                "A":":","S":"L","D":"K","F":"J","G":"H",
                    "H":"G","J":"F","K":"D","L":"S",":":"A",
                "Z":">","X":"<","C":"M","V":"N",
                    "N":"V","M":"C","<":"X",">":"Z",
            },
            "standard":{
                "q":"p","w":"o","e":"i","r":"u","t":"y",
                    "y":"t","u":"r","i":"e","o":"w","p":"q",
                "a":";","s":"l","d":"k","f":"j","g":"h",
                    "h":"g","j":"f","k":"d","l":"s",";":"a",
                "z":"/","x":".","c":",","v":"m","b":"n",
                    "n":"b","m":"v",",":"c",".":"x","/":"z",
                "Q":"P","W":"O","E":"I","R":"U","T":"Y",
                    "Y":"T","U":"R","I":"E","O":"W","P":"Q",
                "A":":","S":"L","D":"K","F":"J","G":"H",
                    "H":"G","J":"F","K":"D","L":"S",":":"A",
                "Z":"?","X":">","C":"<","V":"M","B":"N",
                    "N":"B","M":"V","<":"C",">":"X","?":"Z",
            },
            "xkcd":{
                "q":"p","w":"o","e":"i","r":"u","t":"y",
                    "y":"t","u":"r","i":"e","o":"w","p":"q",
                "a":"'","s":"l","d":"k","f":"j","g":"h",
                    "h":"g","j":"f","k":"d","l":"s",";":"a",
                "z":".","x":",","c":"m","v":"n",
                    "n":"v","m":"c",",":"x",".":"z",
                "Q":"P","W":"O","E":"I","R":"U","T":"Y",
                    "Y":"T","U":"R","I":"E","O":"W","P":"Q",
                "A":"\"","S":"L","D":"K","F":"J","G":"H",
                    "H":"G","J":"F","K":"D","L":"S",":":"A",
                "Z":">","X":"<","C":"M","V":"N",
                    "N":"V","M":"C","<":"X",">":"Z",
            },
        }
        if (typeof mapping === 'string'){
            if (mapping in default_mappings){
                this.mapping = default_mappings[mapping];
            }else{
                throw "Invalid mapping";
            }
        }else{
            //TODO: Validity check
            this.mapping = mapping; // Keyboard mapping
        }
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
                // Todo: For "text" -type "input"s, hit enter instead.
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
