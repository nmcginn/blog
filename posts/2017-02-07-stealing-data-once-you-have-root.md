# 2017 - Stealing data once you have root

At work, a coworker and I were having a discussion about managing secure credentials. We typically use environment variables that are in some way or another available at runtime, and he was saying that environment variables seemed a bit loose. The conventional wisdom is that once somebody has shell access, it's game over. Wanting to test this, I decided to explore how easy it would be, once the attacker has root, to get credentials out of an arbitrary process.

### The test

As the simplest possible test, I fired up a nodejs process and made a variable. This gives me an easy process to attack.

![target process](assets/images/target_process.png)

### The "attack"

My approach for this was to use gdb to get a core dump, then find some way to sift through the data. It turns out this is pretty trivial with `gcore`. We can then use `strings` to extract the bits we're interested in.

![attack process](assets/images/attack_process.png)

### Takeaway

Conventional wisdom holds, when somebody has direct access to your server then there isn't much you can do to stop them. This little experiment assumed root access already, so we are taking for granted privilege escalation in some form or another (this was assumed as part of the original discussion). As someone writing software, _eventually_ you're going to need that database connection string or service account somewhere in memory.
