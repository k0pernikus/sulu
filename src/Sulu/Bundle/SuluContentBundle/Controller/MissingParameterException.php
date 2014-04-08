<?php
/*
 * This file is part of the Sulu CMS.
 *
 * (c) MASSIVE ART WebServices GmbH
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Sulu\Bundle\ContentBundle\Controller;

use Sulu\Component\Rest\Exception\RestException;

/**
 * missing parameter in api
 */
class MissingParameterException extends RestException
{
    /**
     * @var string
     */
    private $name;
    /**
     * @var string
     */
    private $controller;

    function __construct($controller, $name)
    {
        $this->controller = $controller;
        $this->name = $name;
    }

    /**
     * @return string
     */
    public function getController()
    {
        return $this->controller;
    }

    /**
     * @return string
     */
    public function getName()
    {
        return $this->name;
    }
} 
