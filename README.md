# WarpWorks Core

Core library for handling WarpWorks data model.

## Install

    npm install --save @warp-works/core

## Usage

    const warpCore = require('@warp-works/core');

    console.log(warpCore.version);

    const domain = warpCore.getDomainByName('SomeDomain');
    const entity = domain.getEntityByName('EntityName');
