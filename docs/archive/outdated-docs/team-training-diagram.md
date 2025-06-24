# Team Training Architecture Diagram

## Distributed Team Setup

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          SLACK WORKSPACE                                 │
│  ┌─────────────────────┐        ┌────────────────────────┐             │
│  │  #mymcp-training    │        │  #mymcp-dashboard      │             │
│  │                     │        │                        │             │
│  │  👤 Alice: Hello!   │        │  📊 Active Players: 6  │             │
│  │  🎯 Quest Started   │        │  📈 [Activity Chart]   │             │
│  │  🏆 Bob leveled up! │        │  🏆 Top: Charlie (450) │             │
│  └─────────────────────┘        └────────────────────────┘             │
└─────────────────────────────────────────────────────────────────────────┘
                                    ▲
                                    │
                        ┌───────────┴───────────┐
                        │   Slack Integration   │
                        │   (Host Machine)      │
                        │   - Bot service       │
                        │   - Event listener    │
                        │   - Dashboard updater │
                        └───────────┬───────────┘
                                    │
                                    ▼
                        ┌─────────────────────┐
                        │   Redis Cloud       │
                        │   (Shared State)    │
                        │                     │
                        │  game:chat          │
                        │  game:quest:*       │
                        │  game:player:*      │
                        │  game:state:update  │
                        └──────────┬──────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
        ▼                          ▼                          ▼
┌──────────────┐          ┌──────────────┐          ┌──────────────┐
│  Alice's PC  │          │   Bob's PC   │          │ Charlie's PC │
│              │          │              │          │              │
│ Engine:3000  │          │ Engine:3000  │          │ Engine:3000  │
│ ID: player-  │          │ ID: player-  │          │ ID: player-  │
│     alice    │          │     bob      │          │    charlie   │
└──────────────┘          └──────────────┘          └──────────────┘

        ▼                          ▼                          ▼
┌──────────────┐          ┌──────────────┐          ┌──────────────┐
│  Dan's Mac   │          │  Eve's Linux │          │ Frank's WSL  │
│              │          │              │          │              │
│ Engine:3000  │          │ Engine:3000  │          │ Engine:3000  │
│ ID: player-  │          │ ID: player-  │          │ ID: player-  │
│     dan      │          │     eve      │          │    frank     │
└──────────────┘          └──────────────┘          └──────────────┘
```

## Data Flow Example

When Alice completes a quest step:

```
1. Alice's CLI → Alice's Engine
   npm run dev:cli -- complete-step find-allies

2. Alice's Engine → Redis (Publish)
   PUBLISH game:quest:step {
     playerId: "player-alice",
     questId: "global-meeting",
     stepId: "find-allies"
   }

3. Redis → All Subscribers
   - Bob's Engine (updates local cache)
   - Charlie's Engine (updates local cache)
   - Slack Integration (receives event)

4. Slack Integration → Slack Channels
   #mymcp-training: "✅ Alice completed step: find-allies"
   #mymcp-dashboard: Updates player stats

5. Other Players See Update
   - In their CLI status
   - In Slack notifications
   - On dashboard
```

## Network Requirements

```
Each Team Member's Computer:
├── Port 3000 (Engine API) - Local only
├── Outbound HTTPS (Slack webhooks) - Optional
└── Outbound TCP (Redis Cloud) - Required

Host's Computer (Slack Integration):
├── All of the above +
├── Slack WebSocket connection
└── Redis subscription connection

Firewall Rules Needed:
- Outbound TCP to Redis Cloud (port varies)
- Outbound HTTPS to Slack API
- No inbound ports required!
```

## Synchronization Example

```
Time  Alice              Bob                Slack
────  ─────              ───                ─────
0:00  Starts quest   →   [Redis]        →   🎯 Alice started quest
0:01                     Sees update
0:05  Completes step →   [Redis]        →   ✅ Alice: step done
0:06                     Updates score
0:10                     Completes step →   ✅ Bob: step done
0:15  Sees Bob's progress
0:20  Team celebrates in Slack! 🎉
```

## Troubleshooting Connections

```bash
# Test from each machine:

1. Check Node/npm:
   node --version  # Should be 18+
   npm --version   # Should be 9+

2. Test Redis connection:
   npm install -g redis-cli
   redis-cli -u $REDIS_URL ping
   # Should return: PONG

3. Test Engine:
   curl http://localhost:3000/health
   # Should return JSON with status: ok

4. Check multiplayer:
   curl http://localhost:3000/api/multiplayer/status
   # Should show Redis connected

5. Monitor Redis events:
   redis-cli -u $REDIS_URL monitor
   # Watch events flow in real-time
``` 