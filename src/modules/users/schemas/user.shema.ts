import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Role } from '../../../enums/role';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop()
  email: string;

  @Prop({ default: [Role.USER] })
  roles: Role[];

  @Prop()
  invitedUsers: string[];

  @Prop({ default: 0 })
  balance: number;

  @Prop({ default: 0 })
  earnings: number;

  @Prop()
  password: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
