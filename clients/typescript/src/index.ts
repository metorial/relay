import { createClient } from '@lowerdeck/rpc-client';
import type { RelayClient } from '../../../service/src/controllers';

type ClientOpts = Parameters<typeof createClient>[0];

export let createRelayClient = (o: ClientOpts) => createClient<RelayClient>(o);
