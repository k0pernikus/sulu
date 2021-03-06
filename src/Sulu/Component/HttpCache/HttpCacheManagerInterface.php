<?php
/*
 * This file is part of the Sulu CMS.
 *
 * (c) MASSIVE ART WebServices GmbH
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Sulu\Component\HttpCache;

use Sulu\Component\Content\StructureInterface;

/**
 * Cache manager interface
 */
interface HttpCacheManagerInterface
{
    /**
     * @param StructureInterface $structure
     * @param string $environment
     */
    public function expire(StructureInterface $structure, $environment = 'prod');
}
