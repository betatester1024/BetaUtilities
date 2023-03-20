import {initServer} from './server';
import {DBMaintenance} from './database';
import {Room} from './supportRooms'
initServer();
DBMaintenance();
new Room("EUPH_ROOM");