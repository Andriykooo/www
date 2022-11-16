import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { UserRoles } from '../../../enums/userRoles';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  @Prop()
  email: string;

  @Prop({ default: UserRoles.USER })
  role: string;

  @Prop()
  invitedUsers: string[];

  @Prop({ default: 0 })
  balance: number;

  @Prop()
  password: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
