# GiftMaster Discord Bot

## Overview

GiftMaster is a Discord bot with an integrated web dashboard that rewards users for engaging with the server. The bot uses Discord.js v13 with slash commands and provides a tiered reward system with three service levels: Free, Premium, and Booster. Each tier has different cooldowns and is restricted to specific channels. The web dashboard allows administrators to manage account stocks and service configurations through a simple authentication system.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Bot Architecture

**Problem**: Need to create a Discord bot that distributes rewards to users based on their tier level with appropriate cooldowns and channel restrictions.

**Solution**: Implemented a command-based architecture using Discord.js v13 with slash commands. Each service tier (Free, Premium, Booster) has its own command handler with dedicated cooldown management and channel restrictions.

**Key Components**:
- Command handlers stored in `/commands` directory with dynamic loading
- Slash command deployment system supporting both guild-specific and global registration
- In-memory cooldown tracking using JavaScript Set for each user
- File-based account storage in tier-specific directories (`/free`, `/premium`, `/Booster`)
- Permission-based admin commands for stock management

**Pros**: Simple file structure, easy to extend with new commands, minimal dependencies
**Cons**: In-memory cooldowns reset on bot restart, file-based storage doesn't scale well for high volume

### Web Dashboard Architecture

**Problem**: Administrators need a way to manage account stocks and view service information without using Discord commands.

**Solution**: Express.js web server with cookie-based session management and static file serving.

**Key Components**:
- Cookie-based authentication using username/password from config
- Session middleware for maintaining login state
- Static HTML/CSS/JS dashboard served from `/dashboard` directory
- Form-based login system with error pages for invalid credentials and unauthorized access

**Pros**: Simple authentication, no database required, easy to deploy
**Cons**: Credentials stored in plaintext config, no user management system, limited security features

### Data Storage

**Problem**: Need to store and retrieve account credentials for different service tiers.

**Solution**: Text file-based storage with one account per line in format `email:password`.

**Architecture**:
- Separate directories for each tier: `/free`, `/premium`, `/Booster`
- Each service stored in its own `.txt` file (e.g., `MCFA.txt`, `Capes.txt`)
- Line-based reading where first line is dispensed and removed
- Synchronous file operations for account generation

**Pros**: Simple implementation, human-readable, easy to bulk add accounts
**Cons**: No data validation, vulnerable to corruption, inefficient for large datasets, no backup mechanism

### Command System

**Problem**: Need to support both administrative commands and user-facing reward generation with proper permissions.

**Solution**: Slash command architecture with role-based permissions and channel restrictions.

**Commands**:
- `/free`, `/premium`, `/booster` - User commands for generating accounts (channel-restricted, cooldown-enabled)
- `/create` - Admin command to create new service files
- `/add` - Admin command to add accounts to services
- `/stock` - Display current inventory across all tiers
- `/help` - Command listing and information

**Permission Model**: Admin commands check for `MANAGE_CHANNELS` permission

### Configuration Management

**Problem**: Need centralized configuration for bot settings, channel IDs, and credentials.

**Solution**: JSON-based configuration file with environment variable fallback for sensitive data.

**Configuration Elements**:
- Discord bot credentials (clientId, guildId, token via env)
- Dashboard credentials (username, password)
- Channel IDs for each tier
- Cooldown timers per tier
- UI customization (colors, banner, status, footer)
- Command behavior flags

**Pros**: Easy to modify settings, environment variable support for secrets
**Cons**: Sensitive data can be committed to version control, no validation

## External Dependencies

### Discord Integration
- **discord.js v13.16.0** - Discord bot framework for slash commands and gateway interactions
- **@discordjs/builders** - Slash command builder utilities
- **@discordjs/rest** - REST API wrapper for Discord
- **discord-api-types** - TypeScript definitions for Discord API

### Web Server
- **express v4.18.2** - Web server framework for dashboard
- **express-session v1.17.3** - Session management middleware
- **cookie-parser v1.4.6** - Cookie parsing for authentication
- **body-parser v1.20.2** - Request body parsing for form submissions

### Utilities
- **dotenv v16.3.1** - Environment variable management
- **node-fetch v3.2.6** - HTTP request library
- **cat-loggr v1.2.2** - Logging utility for command execution

### Runtime
- **Node.js** - JavaScript runtime environment
- Discord Bot Token (via environment variable)
- Discord Application configured with bot permissions and slash command scope