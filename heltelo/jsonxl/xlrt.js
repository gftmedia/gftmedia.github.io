(function(JSONXL) {

JSONXL.Environment = class Environment {
  constructor(parent = null) {
    this.env = new Map();
    this.parent = parent;
  }

  getvar(name) {
    if (this.env.has(name)) return this.env.get(name);
    if (this.parent) return this.parent.getvar(name);
    throw new ReferenceError("unknown variable: "+name);
  }

  setvar(name, val) {
    this.env.set(name, val);
  }

  rsetvar(name, val) { // recursive set (set!)
    if (this.env.has(name)) this.env.set(name, val);
    else if (this.parent)   this.parent.rsetvar(name, val);
    else                    this.env.set(name, val);
  }
};

JSONXL.ReturnNode = class ReturnNode {
  constructor(val) { this.val = val; }
};


function interpret(node, env) {
  if (Array.isArray(node)) {
    const [op, ...args] = node;
    switch (op) {
    case "set": {
      const val = interpret(args[1], env);
      env.setvar(args[0], val);
      return val;
    }
    case "set!": {
      const val = interpret(args[1], env);
      env.rsetvar(args[0], val);
      return val;
    }

    case "prop": {
      const obj = interpret(args[0], env);
      const key = interpret(args[1], env);
      if (args.length === 3) {
        const val = interpret(args[2], env);
        obj[key] = val;
        return val;
      } else {
        return obj[key];
      }
    }

    case "+": return interpret(args[0], env) + interpret(args[1], env);
    case "-": return interpret(args[0], env) - interpret(args[1], env);
    case "*": return interpret(args[0], env) * interpret(args[1], env);
    case "/": return interpret(args[0], env) / interpret(args[1], env);
    
    case "<": return interpret(args[0], env) < interpret(args[1], env);
    case "<=": return interpret(args[0], env) <= interpret(args[1], env);
    case ">": return interpret(args[0], env) > interpret(args[1], env);
    case ">=": return interpret(args[0], env) >= interpret(args[1], env);
    case "==": return interpret(args[0], env) === interpret(args[1], env);
    case "!=": return interpret(args[0], env) !== interpret(args[1], env);
    case "&&": return interpret(args[0], env) && interpret(args[1], env);
    case "||": return interpret(args[0], env) || interpret(args[1], env);
  
    case "if": {
      const [ncond, nthen, nelse] = args;
      if (interpret(ncond, env)) return interpret(nthen, env);
      else if (nelse !== undefined) return interpret(nelse, env);
      else return null;
    }
    case "while": {
      const [ncond, ...nbody] = args;
      let res = null;
      while (interpret(ncond, env)) {
        const out = interpret(["do", ...nbody], env);
        if (out instanceof JSONXL.ReturnNode) return out;
        res = out;
      }
      return res;
    }

    case "return": {
      return new JSONXL.ReturnNode(interpret(args[0], env));
    }

    case "do": {
      let res = null;
      for (const expr of args) {
        const out = interpret(expr, env);
        if (out instanceof JSONXL.ReturnNode) return out;
        res = out;
      }
      return res;
    }

    case "fn": {
      const [nparams, ...nbody] = args;
      return function(fnargs) {
        const fnenv = new JSONXL.Environment(env);
        fnenv.setvar("__args", fnargs);
        nparams.forEach((p, i) => fnenv.setvar(p, fnargs[i]));
        const res = interpret(["do", ...nbody], fnenv);
        if (res instanceof JSONXL.ReturnNode) return res.val;
        return res;
      }
    }

    case "list": {
      return args.map(v => interpret(v, env));
    }
    default: {
      const fn = env.getvar(op);
      if (typeof fn === "function") {
        return fn(args.map(v => interpret(v, env)));
      } else {
        throw new TypeError(`${op} is not a function`);
      }
    }
    }

  } else if (typeof node === "string") {
    if (node[0] === "'") return node.slice(1); // string literal
    return env.getvar(node);
  } else {
    return node;
  }
};
JSONXL.interpret = interpret;

})(globalThis.JSONXL = globalThis.JSONXL || {});
