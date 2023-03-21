import {initServer} from './server';
import {DBMaintenance} from './database';
import {supportHandler, Room} from './supportRooms'
initServer();
DBMaintenance();
supportHandler.addRoom(new Room("main_support"));