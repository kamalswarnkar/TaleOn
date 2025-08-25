# 🧪 **TaleOn Local Testing Guide**

## **Testing Room Joining Functionality**

### **Method 1: Multiple Browser Windows (Easiest)**
1. **Create Room:**
   - Open your app in Chrome/Firefox
   - Sign up/login with one account
   - Create a room and note the room code (e.g., "ABC123")

2. **Join Room (Same User, Different Session):**
   - Open a **new incognito/private window**
   - Sign up/login with a different account
   - Go to "Join Room" page
   - Enter the room code "ABC123"
   - Enter a different player name
   - Click "Join Room"

3. **Verify:**
   - Both users should appear in the lobby
   - Player names should be different
   - Both should be able to start the game

### **Method 2: Different Browsers**
1. **Chrome:** Create room with one account
2. **Firefox:** Join room with another account
3. **Edge:** Join room with a third account

### **Method 3: Local Network Testing (Best for Real Multi-User)**
1. **Find Your Local IP:**
   ```bash
   # Windows
   ipconfig | findstr "IPv4"
   
   # Your IP: 192.168.1.8 (from your system)
   ```

2. **Start Backend:**
   ```bash
   cd taleon-backend
   npm run dev
   ```

3. **Test with Other Devices:**
   - Connect other devices to same WiFi
   - Open browser on phone/tablet/laptop
   - Navigate to: `http://192.168.1.8:3000`
   - Create/join rooms normally

### **Method 4: Multiple Browser Profiles**
1. **Chrome Profile 1:** Create room
2. **Chrome Profile 2:** Join room
3. **Chrome Profile 3:** Join room

## **What to Test**

### **✅ Room Creation:**
- [ ] Room code is generated (6 characters)
- [ ] Host is set correctly
- [ ] Player name is stored

### **✅ Room Joining:**
- [ ] Can join with valid room code
- [ ] Player name is accepted
- [ ] User is added to room.players array
- [ ] Player name is stored in room.playerNames

### **✅ Lobby Display:**
- [ ] All players show with chosen names
- [ ] Host is clearly marked
- [ ] Player count is correct

### **✅ Game Flow:**
- [ ] Game starts with all players
- [ ] Player names are consistent throughout
- [ ] AI turns work correctly
- [ ] Judgement uses chosen names

## **Common Issues & Solutions**

### **Issue: "Room not found"**
- Check if room code is exactly 6 characters
- Verify backend is running on port 5000
- Check MongoDB connection

### **Issue: "Room is closed"**
- Room might have been closed by host
- Check if room.isActive is false

### **Issue: Player names not showing**
- Verify playerName is sent in join request
- Check room.playerNames Map in database
- Ensure frontend displays chosen names

## **Backend Routes to Test**

### **POST /room/create**
```json
{
  "playerName": "StoryMaster"
}
```

### **POST /room/join**
```json
{
  "roomCode": "ABC123",
  "playerName": "Player2"
}
```

### **GET /room/:code**
- Returns room details with player names

## **Database Check**

### **Room Collection:**
```javascript
// Check if player names are stored
db.rooms.findOne({roomCode: "ABC123"})
// Should show: playerNames: Map with userId -> playerName
```

### **Game Collection:**
```javascript
// Check if games use chosen names
db.games.findOne({roomCode: "ABC123"})
// Should show: players array with proper names
```

## **Quick Test Script**

```bash
# Terminal 1: Start backend
cd taleon-backend
npm run dev

# Terminal 2: Start frontend
cd taleon
npm run dev

# Terminal 3: Check if ports are free
netstat -ano | findstr :5000
netstat -ano | findstr :3000
```

## **Expected Results**

- ✅ Multiple users can join same room
- ✅ Player names are consistent throughout
- ✅ Room codes work across different sessions
- ✅ Games start with all players
- ✅ Judgement system is fair but not overly strict
- ✅ Archive shows proper player names and verdicts

---

**Happy Testing! 🎮✨**
