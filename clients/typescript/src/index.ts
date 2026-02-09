import { createClient } from '@lowerdeck/rpc-client';
import type { RelayClient } from '../../../service/src/controllers';
import { ITemplate } from './templates';

export * from './templates';

type ClientOpts = Parameters<typeof createClient>[0];

type EmailIdentity = Awaited<ReturnType<RelayClient['emailIdentity']['get']>>;

export let createRelayClient = (
  o: ClientOpts & {
    sender: {
      identifier: string;
      name: string;
    };
  }
) => {
  let inner = createClient<RelayClient>(o);

  let sender = inner.sender.upsert({
    identifier: o.sender.identifier,
    name: o.sender.name
  });

  let wrap =
    <Arg0, Args extends any[], R>(fn: (arg0: Arg0, ...args: Args) => Promise<R>) =>
    async (arg0: Omit<Arg0, 'senderId'>, ...args: Args) => {
      let s = await sender;
      return await fn({ ...arg0, senderId: s.id } as any, ...args);
    };

  return {
    sender: {
      get: wrap(inner.sender.get),
      upsert: wrap(inner.sender.upsert)
    },
    emailIdentity: {
      get: wrap(inner.emailIdentity.get),
      upsert: wrap(inner.emailIdentity.upsert)
    },
    email: {
      send: wrap(inner.email.send)
    },
    send: wrap(inner.email.send),

    createTemplate<Data>(
      template: ITemplate<Data>,
      identity: EmailIdentity | Promise<EmailIdentity>
    ) {
      return {
        send: async (i: { data: Data; to: string[] }) => {
          let rendered = await template.render(i.data);
          let s = await sender;

          return await inner.email.send({
            type: 'email',
            to: i.to,
            template: i.data as any,

            emailIdentityId: (await identity).id,
            senderId: s.id,

            content: {
              subject: rendered.subject,
              html: await rendered.html,
              text: await rendered.text
            }
          });
        }
      };
    }
  };
};
