Flow control library focused on readability, convenience & analytics.

# Introduction

Tired of...
- Entering into a new code base with no information? unknown execution paths?
- Juggling asynchronous operations with flow control optimization?
- Building a mock server because your upstream is unstable or often offline?

What if there exists a way to...
- Allow you to create a simple structure that clearly describes your application and/or business logic lifecycle?
- Promote sharing by offering deferred execution for all constructed flows?
- Automatically instrument analytics for all execution paths?

This is `Mercy`.


# API
See the detailed [API Reference](https://github.com/bmille29/mercy/blob/master/API.md).

## Examples

#### Building basic flows
```javascript
const Mercy = require('mercy');

const fail = function (data, next) { return next(new Error('some failure'); };
const noop = function (data, next) { return next(); };
const echo = function (value, next) { return next(null, value); };


// Empty
const empty = Mercy.flow();


// Series
// - Note: Series automatically propagates input
let series = Mercy.flow(Mercy.input(), echo);     // Rest () notation   
let series = Mercy.flow([Mercy.input(), echo]);   // Array [] notation  
let series = Mercy.flow({                         // Object {} notation
    Mercy.input(),      // Pre-built convenience flow to get flow input attached to a key.
    echo                // All raw functions get transformed to Mercy Flows automatically
}).series();

Mercy.execute('foobar', series, (err, meta, data, result) => {

    // console.log(meta);      // returns [object] - Current flow meta data (timers / analytics)
    // console.log(data);      // returns [object] - Flow data object. Contains all information for flow and subflows
    // console.log(result);    // returns 'foobar'
});


// Parallel
// - Note: Parallel does not propagate input. You must specify final() and select results. Can't expect us to read your mind.
const parallel = Mercy.flow({
    input: Mercy.input(),       // Pre-built convenience flow to get flow input attached to a key.
    echo: echo                  // Since input is not propagated, echo is executed with (data, next)
}).final((data, next) => {

    return next(null, [data.input.result, data.echo.result]);
});

Mercy.execute('foobar', parallel, (err, meta, data, result) => {

    // console.log(result);    // returns ['foobar', [object]] - [object] is the data object
});


// Auto
// - Note: Auto does not propagate input. However, it does make use of dependency injection.
//      You must specify final() and select results.
const auto = Mercy.flow({
    input: Mercy.input(),       // Pre-built convenience flow to get flow input attached to a key.
    echo: ['input', echo]       // Here we use dependency injection, echo is executed with (value, next) where (value === data.input.result)
}).final((data, next) => {

    return next(null, [data.input.result, data.echo.result]);
});

Mercy.execute('foobar', auto, (err, meta, data, result) => {

    // console.log(result);    // returns ['foobar', 'foobar']
});
```

#### Lets play a game
```javascript
const Mercy = require('mercy');

// Using additional flow options, determine the output
let count = 0;
const opts = { times: 3, interval: 64 };
const fail = Mercy.flow((data, next) => { return next(new Error(`Count: ${++count}`)); });

const flow = Mercy.flow().timeout(500).tasks({
    wait: Mercy.wait(1000),
    foobar: ['wait', fail.retry(opts)]
});

Mercy.execute(flow, (err, meta, data, result) => {

    // console.log(err);
    // console.log(count);
    // console.log(result);
});
```


# Usage

Usage is a two steps process. First, a flow is constructed using the provided types and options:

```javascript
const foo = function () {};

const flow1 = Mercy.flow(foo)              // series   - Rest () notation   
const flow2 = Mercy.flow([foo]);           // series   - Array [] notation  
const flow3 = Mercy.flow({ task_0: foo }); // parallel - Object {} notation
const flow4 = Mercy.flow({                 // auto (dependencies get injected via `...spread` operator)
    foo: foo,
    bar: ['foo', foo]
});
```

Note that **mercy** flow objects are immutable which means every additional rule added (e.g. `.timeout(1000)`) will return a
new schema object.

Then the flow is executed:

```javascript
Mercy.execute(flow, (err, meta, data, next) => {

    // Your bits here
});

// Mercy Flows can directly call `flow.execute(data, callback)`.

flow.execute((err, meta, data, next) => {

    // Your bits here
});
```

When passing a non-type flow object, the module converts it internally to a flow() type equivalent:

```javascript
const flow1 = { foo: () => {} };
const flow2 = Mercy.flow({ foo: Mercy.flow(() => ()) });
```
