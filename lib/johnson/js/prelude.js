var Johnson = {};

Johnson.Symbol = function(string) {
  this.string = string;
};

Johnson.Symbol.prototype = {
  toString: function() {
    return this.string;
  },

  inspect: function() {
    return ":" + this.toString();
  }
};

Johnson.symbolCache = {};

Johnson.symbolize = function(string) {
  if (!Johnson.symbolCache[string])
    Johnson.symbolCache[string] = new Johnson.Symbol(string);
    
  return Johnson.symbolCache[string];
};

Object.defineProperty(String.prototype, "toSymbol", function() {
  return Johnson.symbolize(this.toString());
}, Object.READ_ONLY | Object.NON_DELETABLE);

(function(origApply) {
  Object.defineProperty(Function.prototype, "apply", function(thisObj, arrayLike) {
    var realArray = arrayLike;
    if (arrayLike != null &&
        !(arrayLike instanceof Array) &&
        typeof arrayLike == 'object' &&
        arrayLike.length != null) {
      realArray = [];
      for (var i = arrayLike.length - 1; i >= 0; i--) {
        realArray[i] = arrayLike[i];
      }
    }
    return origApply.call(this, thisObj, realArray);
  }, Object.READ_ONLY | Object.NON_DELETABLE);
})(Function.prototype.apply);

Johnson.Generator = function(enumerableProxy, namesOnly) {
  if (enumerableProxy.js_properties) {
    this.items = enumerableProxy.js_properties();
  } else {
    this.items = (enumerableProxy.keys ? enumerableProxy.keys() : []).concat(enumerableProxy.methods());
  }
  this.index = 0;
  if (!namesOnly)
    this.obj = enumerableProxy;
};

Johnson.Generator.prototype.__iterator__ = function() {
  return this;
};

Johnson.Generator.prototype.hasNext = function() {
  return this.index < this.items.length;
}

Johnson.Generator.prototype.next = function() {
  if (this.hasNext()) {
    var name = this.items[this.index++];
    if (this.obj) {
      return [name, this.obj[name]];
    } else {
      return name;
    }
  }
  throw StopIteration;
}

Johnson.Generator.create = function(namesOnly) {
  return new Johnson.Generator(this, namesOnly);
}

Johnson.required = {};

Johnson.require = function(file) {
  file = Ruby.File.join(Ruby.File.dirname(file),
    Ruby.File.basename(file, ".js") + ".js");
  
  if(Johnson.required[file]) return false;
  
  for(var directory in Ruby["$LOAD_PATH"]) {
    var path = Ruby.File.join(directory, file);
    
    if(Ruby.File.send("file?", path)) {
      Johnson.required[file] = true;
      Johnson.runtime.load(path);
      
      return true;
    }
  }
  
  throw Ruby.LoadError;
}

this.__defineGetter__("__FILE__", function() { 
  try { throw new Error; } catch(e) {
    return e.stack.split("\n")[2].split("@")[1].split(":").slice(0,-1).join(":");
  }
})

null; // no need to marshal a result
