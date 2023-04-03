import {initServer} from './server';
import {DBMaintenance} from './database';
import {supportHandler, Room} from './supportRooms'
initServer();
DBMaintenance();
supportHandler.addRoom(new Room("ONLINE_SUPPORT", "main_support"));
supportHandler.addRoom(new Room("ONLINE_SUPPORT", "betaos"));
supportHandler.addRoom(new Room("ONLINE_SUPPORT", "betatester1024"));
supportHandler.addRoom(new Room("ONLINE_SUPPORT", "xkcd"));
supportHandler.addRoom(new Room("ONLINE_SUPPORT", "____----"));
supportHandler.addRoom(new Room("HIDDEN_SUPPORT", "sec_support"));
supportHandler.addRoom(new Room("HIDDEN_SUPPORT", "HIDSUPPORT"));
supportHandler.addRoom(new Room("EUPH_ROOM", "support3"));