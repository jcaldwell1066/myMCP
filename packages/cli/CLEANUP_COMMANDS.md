# Redis Commands to Clean Up Test Players

Based on the player list you showed, here are the Redis commands to remove the test players while preserving the important ones.

## Players to Remove
- cli-player-1749619995997 (1850 pts)
- shell-player-1750371548738 (0 pts)
- shell-player-1750371835211 (0 pts)
- cli-player-1750392361675 (0 pts)
- cli-player-1750392410727 (0 pts)
- shell-player-1750393550539 (0 pts)

## Players to Keep
- claude-player
- default-player
- default
- slack-U444KV81E

## Redis Commands

Connect to Redis:
```bash
redis-cli
```

Remove test players from the players set:
```redis
SREM game:players "cli-player-1749619995997" "shell-player-1750371548738" "shell-player-1750371835211" "cli-player-1750392361675" "cli-player-1750392410727" "shell-player-1750393550539"
```

Delete their state data:
```redis
DEL game:state:cli-player-1749619995997
DEL game:state:shell-player-1750371548738
DEL game:state:shell-player-1750371835211
DEL game:state:cli-player-1750392361675
DEL game:state:cli-player-1750392410727
DEL game:state:shell-player-1750393550539
```

Verify remaining players:
```redis
SMEMBERS game:players
```

Exit Redis:
```redis
exit
```

## Alternative: One-liner from Bash

You can also run this as a single command from bash:

```bash
redis-cli SREM game:players "cli-player-1749619995997" "shell-player-1750371548738" "shell-player-1750371835211" "cli-player-1750392361675" "cli-player-1750392410727" "shell-player-1750393550539" && \
redis-cli DEL game:state:cli-player-1749619995997 game:state:shell-player-1750371548738 game:state:shell-player-1750371835211 game:state:cli-player-1750392361675 game:state:cli-player-1750392410727 game:state:shell-player-1750393550539
```

## Verify Cleanup

After running the cleanup, check the player list:

```bash
cd /home/jcaldwell/vibe/sub-modules/myMCP/packages/cli
node list-players.js
```

You should only see:
- claude-player
- default-player  
- default
- slack-U444KV81E 