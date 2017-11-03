CHECK=' \033[32m✔\033[39m'
HR=\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#
IBLACK='\e[1;30m'
GREEN='\e[0;32m'
NC='\e[0m'              # No Color

.PHONY: setup-dev \
	lint watch-lint


setup-dev:
	@echo "installing DEV dependencies"
	@yarn install
	@echo -e "Done" $(CHECK)

###############################
# linting

lint-ts:
	@./node_modules/.bin/tslint -p uml

lint-sol:
	@./node_modules/.bin/solium --dir contracts

lint-js:
	@./node_modules/.bin/standard migrations/*.js test/*.js

lint: lint-ts lint-sol lint-js

watch-lint-sol:
	@./node_modules/.bin/solium --watch --dir contracts


###############################
# typescript

compile-ts-uml:
	@cd uml; tsc --lib es6 *.ts


###############################
# test

run-testrpc:
#	this is not supported in alpine linux (l -C options): @ps l -C node | grep testrpc
# TODO: we should use smaller gas limit 0x47B760
	@ps -a -o args | grep "^node .*testrpc.*8544" || \
		testrpc --port 8544 --network-id 9 --gasLimit 0x989680 \
			--account="0xfdb2886b1ff5a0e60f9a4684e385aa7b77f064730304143f08ba96ca1a17effa,100000000000000000000000000" \
			--account="0x38712cee7ace9c96181cc6a31f55fac50b3ff005d7c1bfa0c3a0121c8fc4b1c2,100000000000000000000000000" \
			--account="0x59983eb3692f525def24c283b775973112d67d30589fa63798dfd70cea82467d,100000000000000000000000000" \
			--account="0xf09a07170897bec0ce50e45ac28f70288e4dd7e9f687cf9d04556554db59a07e,100000000000000000000000000" \
			--account="0xd7ad15ff5b4b8f50bbf6472e15bca78e4d00ead8a2c74da12d18c51c7b2d3d93,100000000000000000000000000" \
			--account="0x21637e41ea5ec2c0a08c734ddcf4fd3fc01eaa7618b412e09b76f86808cb4dd8,100000000000000000000000000" \
			--account="0x75986d9e701e574e888ed76bf084e7a15bcae8c203a84136e64e3ce18ab62b85,100000000000000000000000000" \
			--account="0xb3547fac81fa0d4b553d3c6637f60eb143159d434d3a0ea9ba44a5c5df192c4c,100000000000000000000000000" \
			--account="0x29469148b567bb0142b4e33c518d833c77ef36b3894b56c7291bed448c943a03,100000000000000000000000000" \
			--account="0x4a18b85b882a4eeced0688076397543a601f512225544815abd3c81a3f18fd79,100000000000000000000000000" \
			--account="0x80aa790cf2af4305b9b963877e773a49840a1480e381a308d22ab68e226749b7,100000000000000000000000000" \
			--account="0xeaf6688522ecc4d647b5d73bc3e8193196b69344dde30abdaf3ff0e2165f4bb9,100000000000000000000000000" \
			--account="0x8d8697970c933b856a02c5c2a9e1ead92b434d6cb724a0635219a1568a4cfd51,100000000000000000000000000" \
			--account="0xfad94aef02359239b6c4d2ea412e3f60753d0b2cead4634846ba6e098716e965,100000000000000000000000000" \
			--account="0x168b4e20066d658378e6a7458a6e7f27c93b30657b82be65d1f3466fef720512,100000000000000000000000000" \
			--account="0xb95ae04b0195acc5f9ab7b9bc5876e8ef47fc775f101e274ef9b074e283b35e7,100000000000000000000000000" \
			--account="0xe079bec86d162477bfc1562f4574af45eb5d25f0444c6cc9eb52da7ce22950f7,100000000000000000000000000" \
			--account="0x78558ca27347ebfc0b6a6bed3269b996d6abb0df33d98940184d20f0b60cc42e,100000000000000000000000000"


test:
	truffle test


###############################
# contracts

deploy-contracts-backstage-reset:
	@rm -rf build/contracts/*
	@rm -rf ../contract-deployments/backstage
	@truffle deploy --network backstage --reset
	@cp -r build/contracts/ ../contract-deployments/backstage
	@git log  -n 1 --format="%h [%ci] %s" > ../contract-deployments/backstage/VERSION
	@git -C ../contract-deployments add -A
	git -C ../contract-deployments commit -m "autodeploy" || true
	git -C ../contract-deployments push -f

deploy-contracts-backstage:
	@rm -rf ../contract-deployments/backstage
	@truffle deploy --network backstage
	@cp -r build/contracts/ ../contract-deployments/backstage
	@git log  -n 1 --format="%h [%ci] %s" > ../contract-deployments/backstage/VERSION
	@git -C ../contract-deployments add -A
	git -C ../contract-deployments commit -m "autodeploy" || true
	git -C ../contract-deployments push -f
