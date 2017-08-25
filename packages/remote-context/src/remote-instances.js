/**
 * Copyright 2017 Moshe Simantov
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { RequestAction, ResponseAction } from 'remote-protocol';
import {
  DeleteAction,
  GetAction,
  LocalDefinePropertyAction,
  LocalDeletePropertyAction,
  LocalPreventExtensionsAction,
  LocalReferenceAction,
  LocalSetPrototypeOfAction,
  PropertyDescriptorAction,
  ReflectApplyAction,
  ReflectConstructAction,
  ReflectGetAction,
  ReflectPromiseAction,
  RemoteDefinePropertyAction,
  RemoteDeletePropertyAction,
  RemoteDeletePropertyCacheAction,
  RemotePreventExtensionsAction,
  RemoteReferenceAction,
  RemoteSetFunctionAction,
  RemoteSetObjectAction,
  RemoteSetPropertyCacheAction,
  RemoteSetPrototypeOfAction,
  RemoteSetSymbolAction,
  UndefinedValueAction,
} from './actions';

/**
 * A map with all the context actions with their's codes.
 *
 * @type {object}
 */
export default {
  // WARNING: ORDER IS MATTER!
  // Children classes needs to be before parents

  // Request-response actions
  0x01: RequestAction,
  0x02: ResponseAction,

  // Context actions
  0x10: GetAction,
  0x11: RemoteSetFunctionAction,
  0x12: RemoteSetObjectAction,
  0x13: RemoteSetSymbolAction,
  0x14: DeleteAction,
  0x15: LocalReferenceAction,
  0x16: RemoteReferenceAction,

  // Local Actions
  0x20: LocalDefinePropertyAction,
  0x21: LocalDeletePropertyAction,
  0x22: LocalSetPrototypeOfAction,
  0x23: LocalPreventExtensionsAction,

  // Remote Actions
  0x30: RemoteDefinePropertyAction,
  0x31: RemoteDeletePropertyAction,
  0x32: RemoteSetPrototypeOfAction,
  0x33: RemotePreventExtensionsAction,
  0x34: RemoteSetPropertyCacheAction,
  0x35: RemoteDeletePropertyCacheAction,

  // Reflect Actions
  0x40: ReflectApplyAction,
  0x41: ReflectConstructAction,
  0x42: ReflectGetAction,
  0x43: ReflectPromiseAction,

  // Custom types
  0x51: PropertyDescriptorAction,
  0x52: UndefinedValueAction,
};
