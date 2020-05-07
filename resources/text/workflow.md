# A Development Strategy

The following a strategy adapted from [git flow](https://nvie.com/posts/a-successful-git-branching-model/) and [Github flow](http://scottchacon.com/2011/08/31/github-flow.html). It is slightly less complicated than the former and slightly more complicated than the latter. Here is how it works:

My workflow setup is as follows

<figure style="border: 1px solid; padding: 5px;">
<pre class="diagram">
                         ┌─────────────┐  
                         │   test on   │  
       ┌────────────────▶│ test server │  
       │                 │     z2      │  
┌─────────────┐          └─────────────┘  
│ development │                         
│   work on   │                         
│   laptop    │                         
└─────────────┘                         
       │               ┌───────────────┐
       │               │ production on │
       └──────────────▶│  prod server  │
                       │    zenodeo    │
                       └───────────────┘
</pre>
    <figcaption>workflow setup</figcaption>
</figure>

On my laptop, there are three “branches”: **master**, **dev**, **fix** as depicted in the diagram below:

<figure style="border: 1px solid; padding: 5px;">
<pre class="diagram">
╔═════════════════════════════════════════════════════════════════╦══════════════╦══════════════════╗
║                       development laptop                        ║ test server  ║   prod server    ║
╠═════════════════════════════════════════════════════════════════╬══════════════╬══════════════════╣
├─────────────────────────────────────────────────────────────────┤              │                  │
│                          git branches                           │              │                  │
├───────────────────────┬─────────────┬─────────────┬─────────────┤              │                  │
│          dev          │     fix     │    test     │   master    │              │                  │
├───────────────────────┼─────────────┼─────────────┼─────────────┤              │                  │
│                       │             │             │ ┌─────────┐ │              │                  │
│                       │             │             │ │  init   │ │              │                  │
│                       │             │             │ │(could be│ │              │                  │
│           ┌───────────┼─────────────┼──────┬──────┼─│   the   │ │              │                  │
│           ▼           │             │      ▼      │ │ current │ │              │                  │
│   ┌──────────────┐    │             │  ┌───────┐  │ └─────────┘ │              │                  │
│   │     init     │    │             │  │ init  │  │      ║      │              │                  │
│   └──────────────┘    │             │  └───────┘  │      ║      │              │                  │
│           ║           │             │       ║     │      ║      │              │                  │
│           ╠───────┐   │             │       ║     │      ║      │              │                  │
│           ║       ▼   │             │       ║     │      ║      │              │                  │
│    ┌──────╣   ┌──────┐│             │       ║     │      ║      │              │                  │
│    │      ║   │dev-f1││             │       ║     │      ║      │              │                  │
│    │      ║   └──────┘│             │       ║     │      ║      │              │                  │
│    ▼      ║       │   │             │       ║     │      ║      │              │                  │
│┌──────┐   ║       ▼   │             │       ║     │      ║      │              │                  │
││dev-f2│   ║   ┌──────┐│             │       ║     │      ║      │              │                  │
│└──────┘   ║   │dev-f1││             │       ║     │      ║      │              │                  │
│    │      ║   └──────┘│             │       ║     │      ║      │              │                  │
│    │      ║       │   │             │       ║     │      ║      │              │                  │
│    ▼      ║       ▼   │             │       ║     │      ║      │              │                  │
│┌──────┐   ║   ┌──────┐│             │       ║     │      ║      │              │                  │
││dev-f2│   ║   │dev-f1││             │       ║     │      ║      │              │                  │
│└──────┘   ║   └──────┘│             │       ║     │      ║      │              │                  │
│    │      ║       │   │             │       ║     │      ║      │              │                  │
│    │      ╠───────┘   │             │       ║     │      ║      │              │                  │
│    │      ▼           │             │       ║     │      ║      │              │                  │
│    │ ┌────╩────┐                    │       ▼                   │ ┌──────────┐ │                  │
│    │ │   dev   │     ready to       │  ┌────╩───┐  deployed     │ │   test   │ │                  │
│    │ │RC-1.0.0 │─── test, merge ────┼─>│RC-1.0.0│─  to test  ───┼>│ RC-1.0.0 │ │                  │
│    │ └────╦────┘                    │  └────────┘               │ └──────────┘ │                  │
│    │      ║           │                     ║     │      ║      │       │      │                  │
│    │      ║           │      bug b1 reported      │      ║      │              │                  │
│    │      ║<─ ─ ─ ─ ─ ┼ ─ ─ via Github issues ─ ─ ┼ ─ ─ ─║─ ─ ─ ┼ ─ ─ ─ ┘      │                  │
│    │      ║           │                     ║     │      ║      │              │                  │
│    │      ║           │             │       ║     │      ║      │              │                  │
│    │      ║           │   ┌───────┐ │       ║     │      ║      │              │                  │
│    ▼      ╠───────────┼──>│fix-b1 │ │       ║     │      ║      │              │                  │
│┌──────┐   ║           │   └───────┘ │       ║     │      ║      │              │                  │
││dev-f2│   ║                   │     │       ║     │      ║      │              │                  │
│└──────┘   ║      b1 fixed,    │     │       ║     │      ║      │              │                  │
│    │      ╠─────   merge    ──┘     │       ║     │      ║      │              │                  │
│    │      ▼                         │       ║     │      ║      │              │                  │
│    │ ┌────╩────┐                    │       ▼     │             │ ┌──────────┐ │                  │
│    │ │   dev   │     ready to       │  ┌────╩───┐ │  deployed   │ │   test   │ │                  │
│    │ │RC-1.0.1 │─── test, merge ────┼─>│RC-1.0.0│─┼─  to test  ─┼>│ RC-1.0.1 │ │                  │
│    │ └────╦────┘                    │  └────╦───┘ │             │ └──────────┘ │                  │
│    │      ║           │             │       ║     │      ║      │       │      │                  │
│    │      ║           │             │       ║     │      ║      │              │                  │
│    │      ║           │                     ║     │      ║      │       │      │                  │
│    │      ║           │        bug b1 tested,     │      ║      │              │                  │
│    │      ║<─ ─ ─ ─ ─ ┼ ─ ─ ─   issue closed    ─ ┼ ─ ─ ─║─ ─ ─ ┼ ─ ─ ─ ┘      │                  │
│    │      ║           │                     ║     │      ║      │              │                  │
│    │      ║           │             │       ║     │      ║      │              │                  │
│    │ ┌────╩────┐      │                     ║     │      ║      │              │                  │
│    │ │   dev   │      │       ready for     ║     │  ┌───╩───┐  │  deployed to │    ┌───────┐     │
│    │ │ v1.0.1  │──────┼───> release, merge ─╬─────┼──│v1.0.1 │──┼─ production  ├───>│v1.0.1 │     │
│    │ └────╦────┘      │                     ║     │  └───╦───┘  │              │    └───────┘     │
│    ▼      ║           │             │       ║     │      ║      │              │                  │
│┌──────┐   ║           │             │       ║     │      ║      │              │                  │
││dev-f2│   ║           │             │       ║     │      ║      │              │                  │
│└──────┘   ║           │             │       ║     │      ║      │              │                  │
│    │      ║           │             │       ║     │      ║      │              │                  │
│    │ ┌────╩────┐      │                     ║     │      ║      │ ┌──────────┐ │                  │
│    │ │   dev   │      │       deployed to   ║     │      ║      │ │   test   │ │                  │
│    └>│RC-1.1.1 │──────┼──────    test     ──╬─────┼──────╬──────┼>│ RC-1.1.1 │ │                  │
│      └────╦────┘      │                     ║     │      ║      │ └──────────┘ │                  │
│           ║           │             │       ║     │      ║      │              │                  │
│           ▼           │             │       ▼     │      ▼      │              │                  │
</pre>
    <figcaption>git branches setup on my laptop, test and production servers. The solid arrows are <code>git merge</code> and <code>git clone</code>, dashed arrows are notifications from Github Issues Tracker, boxes are commits, boxes with tags are releases</figcaption>
</figure>

The rules of the game are:

1. **master** is *always* production ready, deployable, and the one actually deployed on the production server. This branch could well have been named **production**, but is called **master** in keeping with the `git` custom.
2. **dev** is the meta-branch (hence the double quotes above) on my laptop where all the development of new features happens. it consists of a main branch called **dev**, with each feature getting its own branch. There is a simple naming convention for feature branches – 'dev-<feature_name>'. 
3. When the feature is finished, the feature branch is pushed to Github.
4. *(optional)* If a review is required, a Github `pull request` is created to invite potential reviewers.
5. If a feature review is not required, or once an optional review consensus is reached, the 'dev-<feature_name>' branch is merged into **dev**, a Release Candidate (RC) tag is added following the semver convention, and the tagged branch is pushed to the test server.
6. Once testing confirms the feature is working, the **dev** version is tagged with a final release version by removing the RC part from the tag, and the commit is merged into **master**, which is then pushed to the production server for the world to use.
7. **fix** is the meta-branch that contains the work done fixing things that don’t work on the test or the production servers. Each fix too gets a name following the naming convention – 'fix-<bug_name>'. If testing finds a bug on the test server, or a user finds a bug on the production server, a Github issue is created with the appropriate label. 
8. The resulting notification leads to creating a 'fix-<bug_name>' from either the tagged **dev** commit that is on the test server or the tagged **master** commit that is on the production server, as the case may be. 
9. Once the fix is complete, it is merged back into the **dev** branch, an RC tag with an appropriately bumped up version number is added, and it is pushed to the test server. The testing cycle repeats (#6 above).