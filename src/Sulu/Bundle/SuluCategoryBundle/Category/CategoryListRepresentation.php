<?php
/*
 * This file is part of the Sulu CMS.
 *
 * (c) MASSIVE ART WebServices GmbH
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Sulu\Bundle\CategoryBundle\Category;

use Hateoas\Representation\CollectionRepresentation;
use Hateoas\Representation\PaginatedRepresentation;
use JMS\Serializer\Annotation\Expose;
use JMS\Serializer\Annotation\XmlAttribute;
use JMS\Serializer\Annotation\ExclusionPolicy;
use Hateoas\Configuration\Annotation\Relation;
use Hateoas\Configuration\Annotation\Route;
use Sulu\Component\Rest\ListBuilder\ListRepresentation;

/**
 * This class represents a list for the categories
 * @package Sulu\Component\Rest\ListBuilder
 * @ExclusionPolicy("all")
 * @Relation(
 *      "children",
 *      href = @Route(
 *          "expr(object.getRoute())",
 *          parameters = "expr(object.getParameters() + { parent: '{parentId}' })",
 *          absolute = "expr(object.isAbsolute())",
 *      )
 * )
 * )
 */
class CategoryListRepresentation extends ListRepresentation
{
    /**
     * @param mixed $data The data which will be presented
     * @param string $rel The name of the relation inside of the _embedded field
     * @param string $route The name of the route, for generating the links
     * @param array $parameters The parameters to append to the route
     * @param integer $page The number of the current page
     * @param integer $limit The size of one page
     * @param integer $total The total number of elements
     */
    public function __construct($data, $rel, $route, $parameters, $page, $limit, $total)
    {
        parent::__construct($data, $rel, $route, $parameters, $page, $limit, $total);
    }
}
