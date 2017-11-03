// Copyright (C) 2017 Sweetbridge Foundation, Switzerland
// All Rights Reserved
// Unauthorized reproducing or copying of this work, via any medium is strictly prohibited
// Written by the Sweetbridge Foundation Team, https://sweetbridge.com/
//
pragma solidity ^0.4.17;


import "./Assets.sol";
import "./BridgeToken.sol";
import "./Math.sol";
import "./Wallet.sol";


contract VaultConfig is SecuredWithRoles {
    uint32 public maxUOUdays;
    // max UOU ratios per token in basis point: 1 = 0.01%
    mapping (address => uint32) public maxUOU;

    // TODO: this has to be adjusted to the "SB Economics and crowdsale" spec
    // Denomination in basis point: 1 = 0.01%
    uint256 public uouFee;

    function VaultConfig(address rolesContract) SecuredWithRoles("VaultConfig", rolesContract) public {}

    function setMaxUOUdays(uint32 days_) public roleOrOwner("assetManager") {
        maxUOUdays = days_;
    }

    function setMaxUOU(address token, uint32 ratio) public roleOrOwner("assetManager") {
        maxUOU[token] = ratio;
    }

    // lenght of the array should be smaller less then 256, otherwise OOG will be thrown.
    function setMaxUOUs(address[] token, uint32[] ratio) public roleOrOwner("assetManager") {
        require(token.length == ratio.length);
        for (uint32 i = 0; i < token.length; ++i) {
            maxUOU[token[i]] = ratio[i];
        }
    }
}


contract VaultFactory is VaultFactoryI {
    function createVault(address wallet) public returns (address) {
        return new Vault(wallet);
    }
}


contract VaultEvents {
    event UouRequested(address vault, uint256 brgAmount, uint256 uouIndex); //move event to settlement bus
    event UouRequestApproved(address vault, uint256 brgAmount, uint256 uouIndex); //move event to settlement bus
    event UouRequestDeclined(address vault, uint256 brgAmount, uint256 uouIndex); //move event to settlement bus
}


/*Each wallet belongs to exactly one user who is the owner of the contract
  the tokens sent to the wallet belong to it and can only be transfered by calling the transfer
  function on the wallet */
contract Vault is Assets, VaultEvents {
    enum Status {Undefined, Rejected, Accepted}

    struct UOU {
        uint128 initialAmount;
        uint128 repaidAmount;
        uint128 fee;
        uint256 time;
        Status decision;
    }

    UOU[] public uous;

    Wallet public wallet;

    uint256 public amountDue;

    function Vault(address wallet_)
    Assets([Wallet(wallet_).directory().root().swt(), Wallet(wallet_).directory().root().brg(Wallet(wallet_).currency())],
    "Vault", Wallet(wallet_).roles()) public
    {
        wallet = Wallet(wallet_);
        owner = wallet.owner();
    }

    function isEmpty() public view returns (bool) {
        return uous.length <= 0;
    }

    function brgBalance() public view returns (uint256) {
        return BridgeToken(wallet.brg()).balanceOf(this);
    }

    function uouCount() public view returns (uint256) {
        return uous.length;
    }

    function takeOwnership() public onlyRole("treasury") {
        owner = msg.sender;
        wallet.removeVault(this);
    }

    function remove() public onlyOwner {
        require(uous.length == 0);
        for (uint32 i = 0; i < assets.length; ++i) {
            assets[i].transfer(wallet, assets[i].balanceOf(this));
        }
        wallet.removeVault(this);
        selfdestruct(wallet);
    }

    // the repayUou can only be called from the BridgeCoin contract
    function repayUou(uint128 brgAmount, uint256 uouIndex) public returns (uint128) {
        require(msg.sender == wallet.brg());
        UOU storage uou = uous[uouIndex];
        require(uou.decision == Status.Accepted);
        // hsub checks if maxAmount is not negative
        uint128 maxAmount = Math.hsub(uou.initialAmount, uou.repaidAmount);
        if (brgAmount > maxAmount) {
            brgAmount = maxAmount;
        }
        uou.repaidAmount = Math.hadd(uou.repaidAmount, brgAmount);
        return brgAmount;
    }

    /* create a UOU request for the oracle to approve or reject*/
    function requestUou(uint128 brgAmount) public onlyOwner {
        // limit the number of UOUs to avoid an OOG during operations
        require(uous.length < 255);
        UOU memory uou;
        uou.initialAmount = brgAmount;
        uou.time = now;
        uous.push(uou);
        UouRequested(this, brgAmount, uous.length - 1);
    }

    function acceptUouRequest(uint256 uouIndex) public onlyRole("uouOracle") {
        require(uous[uouIndex].decision == Status.Undefined);
        uous[uouIndex].decision = Status.Accepted;
        amountDue = Math.add(uous[uouIndex].initialAmount, amountDue);
        BridgeToken(wallet.brg()).mintFor(address(wallet), uous[uouIndex].initialAmount);
        UouRequestApproved(this, uous[uouIndex].initialAmount, uouIndex);
    }

    function rejectUouRequest(uint256 uouIndex) public onlyRole("uouOracle") {
        require(uous[uouIndex].decision == Status.Undefined);
        uous[uouIndex].decision = Status.Rejected;
        UouRequestDeclined(this, uous[uouIndex].initialAmount, uouIndex);
    }

}
