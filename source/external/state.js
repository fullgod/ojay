/**
 * Copyright (c) 2007-2008 James Coglan
 * http://jsclass.jcoglan.com
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

JS.State = (function(Class) {
  
  var addStateMethods = function(state, klass) {
    for (var method in state)
      (function(methodName) {
        klass.instanceMethod(methodName, function() {
          var func = (this._state || {})[methodName];
          return func ? func.apply(this, arguments): this;
        }, false);
      })(method);
  };
  
  var buildStateCollection = function(collection, superStates, states) {
    var state, method;
    for (state in states) {
      collection[state] = collection[state] || {};
      for (method in states[state])
        Class.addMethod(collection[state], superStates[state], method, states[state][method]);
    }
  };
  
  Class.addMethod = (function(wrapped) {
    return function(object, superObject, name, func) {
      if (name != 'states' || typeof func != 'object') return wrapped.apply(Class, arguments);
      var collection = {}, superStates = superObject.states || {};
      buildStateCollection(collection, superStates, superStates);
      buildStateCollection(collection, superStates, func);
      return wrapped.call(Class, object, superObject, 'states', collection);
    };
  })(Class.addMethod);
  
  return JS.Module({
    _getState: function(state) {
      return  (typeof state == 'object' && state) ||
              (typeof state == 'string' && ((this.states || {})[state] || {})) ||
              {};
    },
    
    setState: function(state) {
      this._state = this._getState(state);
      addStateMethods(this._state, this.klass);
    },
    
    inState: function() {
      for (var i = 0, n = arguments.length; i < n; i++) {
        if (this._state == this._getState(arguments[i])) return true;
      }
      return false;
    }
  });
})(JS.Class);
