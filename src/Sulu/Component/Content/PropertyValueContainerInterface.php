<?php
/*
 * This file is part of the Sulu CMS.
 *
 * (c) MASSIVE ART WebServices GmbH
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Sulu\Component\Content;

/**
 * Defines a interface for a value container
 * @package Sulu\Component\Content
 */
interface PropertyValueContainerInterface
{
    /**
     * Return a array representation of this container
     * @param int $layer
     * @return array
     */
    public function toArray($layer);
} 
