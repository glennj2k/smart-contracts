// Copyright (C) 2015, 2016, 2017  DappHub, LLC

// Licensed under the Apache License, Version 2.0 (the "License").
// You may not use this file except in compliance with the License.

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND (express or implied).

pragma solidity ^0.4.17;

import "./Owned.sol";


contract Authority {
    // the signature of a function is the result of keccak256("functionName(paramType1,paramtypeN)")
    function canCall(address src, address dst, bytes4 sig) public view returns (bool);
}


contract AuthEvents {
    event LogSetAuthority (address indexed authority);
    event LogSetOwner     (address indexed owner);
    event UnauthorizedAccess (address caller, bytes4 sig);
}


contract Auth is AuthEvents, Owned {
    Authority  public  authority;

    function Auth() public {
        owner = msg.sender;
        LogSetOwner(msg.sender);
    }

    function setOwner(address owner_) public auth {
        owner = owner_;
        LogSetOwner(owner);
    }

    function setAuthority(Authority authority_) public auth {
        authority = authority_;
        LogSetAuthority(authority);
    }

    modifier auth {
        assert(isAuthorized(msg.sender, msg.sig));
        _;
    }

    function isAuthorized(address src, bytes4 sig) internal returns (bool) {
        if (src == address(this)) {
            return true;
        } else if (src == owner && authority == Authority(0)) {
        /*the owner has privileges only as long as no Authority has been defined*/
            return true;
        } else if (authority != Authority(0) && authority.canCall(src, this, sig)) {
            return true;
        } else {
            UnauthorizedAccess(src, sig);
            return false;
        }
    }
}
