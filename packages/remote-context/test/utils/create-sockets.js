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

import { PassThrough } from 'stream';
import duplexify from 'duplexify';

export default function() {
  const a = new PassThrough();
  const b = new PassThrough();

  const peer1 = duplexify(a, b);
  const peer2 = duplexify(b, a);

  peer1.on('finish', () => {
    if (peer2.writable) {
      peer2.setReadable(null);
    } else {
      peer2.destroy();
    }
  });

  peer2.on('finish', () => {
    if (peer1.writable) {
      peer1.setReadable(null);
    } else {
      peer1.destroy();
    }
  });

  peer1.on('close', () => {
    peer2.destroy();
  });

  peer2.on('close', () => {
    peer1.destroy();
  });

  return [peer1, peer2];
}
