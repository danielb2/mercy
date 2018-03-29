## Mercy

**Table of Contents**

- [Overview](#overview)
<!-- - [Basic usage](#basic-usage)
- [Configuration](#configuration)
  - [Options](#options)
  - [Example Manifest](#example-manifest) -->

### Overview

```javascript

// Feature set

A flow control library that provides several, common, pre-built flows.
A flow is simply a grouping of higher-order functions which are executed in a given order.

In other words, it is a glorified wrapper for business logic.


Ability to...

- Follow Unix style _(do one thing really well)_ pattern
- Unify flow control across both `test cases` and `route handlers` (business logic)

- Contain several "convenience" flows for common use cases.
    - Libraries / route handlers / business logic
        - wreck: wreck()

    - Test Cases
        - compose: creates an instance of a REST API server
            - Hapi: (manifest, glue options)
            - Electrode: (config)
        - start: ('ref compose' -> start server)
        - prepare: [compose, start] (automatically references server from compose)
        - restart ('ref compose / prepare' -> stop & start)
        - stop: ('ref compose / prepare' -> start server)

        - echo: Mercy.prepare().echo('headers.cookie');
            - Hoek.reach(request, 'headers.cookie');

        - inject: server.inject()

        - mock: Utilize nock + lab flags to automatically generate req/res fixtures for integration tests.
            - using simple flags to `refresh` and perform offline `unit` testing.
            - ability to run all tests in parallel

    - Common
        - Validate: Joi.validate('ref', schema)
        - transform: hoek.transform()
        - custom: Pass function to be executed. Injection tricks work here as well.


- Allow contextualization
    - similar to joi creating new instances with updated configuration
    - similar to wreck.defaults()
    - must support "per request" contextualization in some fashion.


- Allows fine grained control of flows
    - timeout: (ms)
    - retry: async.retry(3) async.retry({ attempts: 3, interval: 1000 })
    - abortEarly:
    - optional:
    - wait: (setTimeout)
    - Mercy.any().wait()


- Allows construction of `new flows` / `subflows`
    - race: returns the first flow to complete successfully
    - alternatives: Try one first, if doesnt work then try next
    - switch: based on specified data.*.value then execute single function
        - Needed for supporting different verticals
        - Allows for simplified output formats

    - auto
    - parallel
    - series

    - append: row
    - concat: column

    - merge: Merging refers to combining the two flows together, preserving their order. Depending on the context it could keep only the unique records or preserve them.

    - join: Joining refers to keeping only the records common to both lists.


- Allow `nesting` and thereby...
    - Allow plugins to share common flows
        - Ownership, responsibility, updates are controlled by single, proper & consistent source.
        - peer dependences and requirements manage any changes


    - Allows extensions (pending initial concept, management will likely change)
        - Flow plugin will manage all extensions for a given server.
        - Any plugin wishing to have common flows utilized will be required to "server.expose" their flows.


- Development / Debugging
    - tree(): pretty prints the entire flow tree along with any tags, descriptions, etc
    - errors: specific error messages like Joi. Unlike async.auto() which says "inexistent dependency".


- Analytics
    - Automatic instrumentation of all (flows / subflows / tasks)
    - Immediate identification of errors, flow, and subsection
    - Can use to generate flame graphs and optimize specific to business logic.
        - Records runtimes of any given (flow / subflow / task)
        - Records both order and (series / parallel)
        - Maybe records memory utilization for a specific flow?

```
