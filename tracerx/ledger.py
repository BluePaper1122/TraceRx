"""In-memory demonstration of scoped lookup and record fingerprint verification.
Not Fabric, authentication, encrypted transport, immutable storage or compliance.
"""
import hashlib
import hmac
import json
from copy import deepcopy

class MockLedger:
    def __init__(self):
        self._records = {}

    @staticmethod
    def fingerprint(payload):
        return hashlib.sha256(json.dumps(payload,sort_keys=True,separators=(',',':'),allow_nan=False).encode()).hexdigest()

    def register(self, token, institution, payload, allowed_institutions):
        if token in self._records:
            raise ValueError('Record token already registered')
        self._records[token] = (institution,deepcopy(payload),self.fingerprint(payload),frozenset(allowed_institutions))

    def lookup(self, token, requester):
        record = self._records.get(token)
        if record is None:
            return {'state':'not_found'}
        institution,payload,digest,allowed = record
        if requester not in allowed:
            return {'state':'access_denied'}
        if not hmac.compare_digest(digest,self.fingerprint(payload)):
            return {'state':'verification_failed'}
        return {'state':'verified','institution':institution,'sha256':digest,'payload':deepcopy(payload)}
