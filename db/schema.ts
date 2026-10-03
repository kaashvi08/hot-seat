import {sqliteTable,text,index} from 'drizzle-orm/sqlite-core';
export const profiles=sqliteTable('profiles',{id:text('id').primaryKey(),owner:text('owner').notNull(),name:text('name').notNull(),data:text('data').notNull(),created:text('created').notNull()},t=>[index('profiles_owner').on(t.owner)]);
