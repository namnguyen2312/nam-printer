#import <Foundation/Foundation.h>
#import "PrintImageBleWriteDelegate.h"

@implementation PrintImageBleWriteDelegate

- (void)didWriteDataToBle:(BOOL)success {
    NSLog(@"PrintImageBleWriteDelegate didWriteDataToBle: %d", success ? 1 : 0);
    if (success) {
        if (_now == -1) {
            if (_pendingResolve) {
                _pendingResolve(nil);
                _pendingResolve = nil;
            }
        } else if (_now >= [_toPrint length]) {
            // ASCII ESC M 0 CR LF
            unsigned char initPrinter[5] = {27, 77, 0, 13, 10};
            NSData *initData = [NSData dataWithBytes:initPrinter length:5];
            [RNBluetoothManager writeValue:initData withDelegate:self];
            _now = -1;
            [NSThread sleepForTimeInterval:0.01f];
        } else {
            [self print];
        }
    } else {
        if (_pendingReject) {
            _pendingReject(@"PRINT_IMAGE_FAILED", @"PRINT_IMAGE_FAILED", nil);
            _pendingReject = nil;
        }
    }
}

- (void)print {
    @synchronized (self) {
        NSInteger sizePerLine = (NSInteger)(_width / 8);
        NSInteger remainingLength = [_toPrint length] - _now;
        if (sizePerLine > remainingLength) {
            sizePerLine = remainingLength;
        }

        if (sizePerLine > 0) {
            NSData *subData = [_toPrint subdataWithRange:NSMakeRange(_now, sizePerLine)];
            NSLog(@"Write data: %@", subData);
            [RNBluetoothManager writeValue:subData withDelegate:self];
            _now += sizePerLine;
            [NSThread sleepForTimeInterval:0.01f];
        }
    }
}

@end
