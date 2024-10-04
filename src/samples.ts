export const javascriptSample = /* Javascript */`
console.log("Foo")
1 + 1
`;

export const phpSample = /* PHP */`
<?php
echo "Output PHP script";

return 4;
`;

export const pythonSampleBasic = /* Python */`
import random
import time

#num = random.randint(3, 9)
num = int(input('Hello'))

print("The current time is " + str(time.time()))

print("Random number is " + str(num))

time.time()
`;

export const pythonSampleLoop = /* Python */`
#num = random.randint(3, 9)
num = int(input('How many times should this loop?'))

for i in range(num):
  print("Loop number #" + str(i + 1))
`;

export const pythonSamples = {
  'Basic': pythonSampleBasic,
  'Loop': pythonSampleLoop,
}
