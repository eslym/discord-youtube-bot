import { createClient } from 'redis';
import {get as config} from "./config";

export const redis = createClient(config('redis'));
